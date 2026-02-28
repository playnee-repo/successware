import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import { getGeminiModelForConfig, buildPrompt, FALLBACK_SYSTEM_PROMPT } from '@/shared/config/gemini'
import type { Atividade, ConfiguracaoAtividade, Artefato } from '@/entities/artifact/model/types'
import type { Iteration } from '@/entities/iteration/model/types'
import type { Project } from '@/entities/project/model/types'

interface ExecuteAiParams {
  projeto: Project
  iteracao: Iteration
  atividade: Atividade
  configuracao: ConfiguracaoAtividade
  nomeArtefato: string
  artefatosAprovados?: Artefato[]
}

interface ExecuteAiResult {
  artefato: Artefato
  chatMessage: string
}

async function executeAiCall(params: ExecuteAiParams): Promise<ExecuteAiResult> {
  const { projeto, iteracao, atividade, configuracao, nomeArtefato, artefatosAprovados = [] } = params

  // 1. Buscar artefatos existentes com o mesmo nome para obter versão atual
  const { data: existingArtefatos } = await supabase
    .from('artefatos')
    .select('versao')
    .eq('iteracao_id', iteracao.id)
    .eq('atividade_id', atividade.id)
    .eq('nome', nomeArtefato)
    .order('versao', { ascending: false })
    .limit(1)

  const currentVersion = existingArtefatos && existingArtefatos.length > 0
    ? existingArtefatos[0].versao
    : 0
  const newVersion = currentVersion + 1

  // 2. Buscar documentos de contexto do projeto
  const { data: documentos } = await supabase
    .from('documentos_projeto')
    .select('titulo, conteudo_md')
    .eq('projeto_id', projeto.id)
    .eq('ativo', true)
    .order('ordem')
  const contextDocumentos = documentos && documentos.length > 0
    ? `\n\n## Documentos do Projeto (contexto obrigatório)\n\n${documentos.map(d => `### ${d.titulo}\n\n${d.conteudo_md}`).join('\n\n---\n\n')}`
    : ''

  // 2b. Montar contexto de artefatos aprovados
  const contextAprovados = artefatosAprovados.length > 0
    ? `\n\n## Artefatos já aprovados nesta iteração\n\n${artefatosAprovados.map(a => {
        const c = a.conteudo_json as Record<string, unknown>
        return typeof c?.md === 'string' ? c.md : JSON.stringify(c)
      }).join('\n\n')}`
    : ''

  // 3. Montar prompt
  const agentId = configuracao.agente_responsavel || 'SCRIBE'
  const template = configuracao.prompt_template || `Você é ${agentId}, especialista em ${atividade.nome}.
Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}
{{documentos}}
{{contexto}}
Gere o conteúdo em Markdown estruturado. Retorne APENAS Markdown válido.`

  const prompt = buildPrompt(template, {
    projeto_nome: projeto.nome,
    iteracao_modulo: iteracao.modulo_foco || iteracao.nome,
    documentos: contextDocumentos,
    contexto: contextAprovados,
  })

  // 4. Buscar config do agente responsável no DB
  const { data: agenteCfg } = await supabase
    .from('agentes_config')
    .select('*')
    .eq('id', agentId)
    .single()

  const systemPrompt = agenteCfg?.system_prompt ?? FALLBACK_SYSTEM_PROMPT
  const model = getGeminiModelForConfig(agenteCfg ?? null)

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: `Entendido. Estou pronto para atuar como ${agentId} e gerar documentação em Markdown.` }],
      },
    ],
  })

  const result = await chat.sendMessage(prompt)
  const responseText = result.response.text()

  // 5. Limpar backticks e salvar como { md: "..." }
  const cleaned = responseText
    .replace(/^```(?:markdown)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
  const conteudoJson: Record<string, unknown> = { md: cleaned || responseText }

  // 6. Salvar no banco
  const { data: novoArtefato, error } = await supabase
    .from('artefatos')
    .insert({
      iteracao_id: iteracao.id,
      atividade_id: atividade.id,
      configuracao_id: configuracao.id,
      nome: nomeArtefato,
      conteudo_json: conteudoJson,
      versao: newVersion,
      agente_autor: agentId,
      status_aprovacao: 'rascunho',
      preferencia_view: 'visual',
    })
    .select()
    .single()

  if (error || !novoArtefato) {
    throw new Error(`Erro ao salvar artefato: ${error?.message}`)
  }

  // 7. Montar mensagem de resumo para o chat
  const chatMessage = newVersion === 1
    ? `Gerei o artefato **${nomeArtefato}** (v${newVersion}) para a iteração **${iteracao.nome}**. Revise o conteúdo no editor e aprove quando estiver satisfeito.`
    : `Regenerei **${nomeArtefato}** — agora na versão **v${newVersion}**. Compare com a versão anterior e aprove se adequado.`

  return { artefato: novoArtefato as Artefato, chatMessage }
}

export function useExecuteAi() {
  const queryClient = useQueryClient()
  const [isStreaming, setIsStreaming] = useState(false)

  const mutation = useMutation({
    mutationFn: executeAiCall,
    onMutate: () => {
      setIsStreaming(true)
    },
    onSettled: () => {
      setIsStreaming(false)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['artefatos', variables.iteracao.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['mensagens', variables.iteracao.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['atividades-progresso'],
      })
    },
  })

  return {
    execute: mutation.mutateAsync,
    isExecuting: mutation.isPending || isStreaming,
    error: mutation.error,
    reset: mutation.reset,
  }
}

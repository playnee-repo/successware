import { buildPrompt, FALLBACK_SYSTEM_PROMPT } from '@/shared/config/gemini'
import { getAiProvider } from '@/shared/api/container'
import type { IArtefatoRepository } from '@/entities/artifact/api/IArtefatoRepository'
import type { IDocumentoRepository } from '@/entities/document/api/IDocumentoRepository'
import type { IAgenteRepository } from '@/entities/agent/api/IAgenteRepository'
import type { Atividade, ConfiguracaoAtividade, Artefato } from '@/entities/artifact/model/types'
import type { Iteration } from '@/entities/iteration/model/types'
import type { Project } from '@/entities/project/model/types'

export interface ExecuteAiParams {
  projeto: Project
  iteracao: Iteration
  atividade: Atividade
  configuracao: ConfiguracaoAtividade
  nomeArtefato: string
  artefatosAprovados?: Artefato[]
  empresaId: string
}

export interface ExecuteAiResult {
  artefato: Artefato
  chatMessage: string
}

export class ExecuteAiService {
  constructor(
    private readonly artefatoRepo: IArtefatoRepository,
    private readonly documentoRepo: IDocumentoRepository,
    private readonly agenteRepo: IAgenteRepository,
  ) {}

  async execute(params: ExecuteAiParams): Promise<ExecuteAiResult> {
    const { projeto, iteracao, atividade, configuracao, nomeArtefato, artefatosAprovados = [], empresaId } = params

    // 1. Versão atual do artefato
    const currentVersion = await this.artefatoRepo.findCurrentVersion(
      iteracao.id,
      atividade.id,
      nomeArtefato,
    )
    const newVersion = currentVersion + 1

    // 2. Documentos de contexto do projeto
    const documentos = await this.documentoRepo.findActiveByProjeto(projeto.id)
    const contextDocumentos = documentos.length > 0
      ? `\n\n## Documentos do Projeto (contexto obrigatório)\n\n${documentos.map(d => `### ${d.titulo}\n\n${d.conteudo_md}`).join('\n\n---\n\n')}`
      : ''

    // 3. Contexto de artefatos aprovados
    const contextAprovados = artefatosAprovados.length > 0
      ? `\n\n## Artefatos já aprovados nesta iteração\n\n${artefatosAprovados.map(a => {
          const c = a.conteudo_json as Record<string, unknown>
          return typeof c?.md === 'string' ? c.md : JSON.stringify(c)
        }).join('\n\n')}`
      : ''

    // 4. Montar prompt: contexto sempre enviado; prompt_template da definição é adendo ao agente
    const agentId = configuracao.agente_responsavel || 'SCRIBE'
    const contextoCompleto = [contextDocumentos, contextAprovados].filter(Boolean).join('\n\n')
    const vars = {
      projeto_nome: projeto.nome,
      iteracao_modulo: iteracao.modulo_foco || iteracao.nome,
      documentos: contextDocumentos,
      contexto: contextoCompleto,
    }

    const contextBlock = `Projeto: ${vars.projeto_nome} | Módulo/foco: ${vars.iteracao_modulo}
${vars.documentos ? vars.documentos + '\n\n' : ''}${vars.contexto ? `## Contexto adicional\n\n${vars.contexto}` : ''}`.trim()

    const defaultInstruction = `Com base no contexto acima, gere o conteúdo em Markdown estruturado para a atividade "${atividade.nome}". Retorne APENAS Markdown válido.`
    const addendum = configuracao.prompt_template
      ? buildPrompt(configuracao.prompt_template, vars)
      : defaultInstruction

    const prompt = `${contextBlock}\n\n---\n\n${addendum}`

    // 5. Buscar config do agente e chamar IA
    const agenteCfg = await this.agenteRepo.findById(agentId)
    const systemPrompt = agenteCfg?.system_prompt ?? FALLBACK_SYSTEM_PROMPT
    const aiProvider = await getAiProvider()

    const responseText = await aiProvider.chatComplete(systemPrompt, [], prompt, agenteCfg)

    // 6. Limpar backticks e salvar
    const cleaned = responseText
      .replace(/^```(?:markdown)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()
    const conteudoJson: Record<string, unknown> = { md: cleaned || responseText }

    const novoArtefato = await this.artefatoRepo.create({
      iteracao_id: iteracao.id,
      atividade_id: atividade.id,
      configuracao_id: configuracao.id,
      nome: nomeArtefato,
      conteudo_json: conteudoJson,
      versao: newVersion,
      agente_autor: agentId,
      status_aprovacao: 'rascunho',
      empresa_id: empresaId,
    })

    // 7. Mensagem de resumo para o chat
    const chatMessage = newVersion === 1
      ? `Gerei o artefato **${nomeArtefato}** (v${newVersion}) para a iteração **${iteracao.nome}**. Revise o conteúdo no editor e aprove quando estiver satisfeito.`
      : `Regenerei **${nomeArtefato}** — agora na versão **v${newVersion}**. Compare com a versão anterior e aprove se adequado.`

    return { artefato: novoArtefato, chatMessage }
  }
}

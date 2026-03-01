import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getGeminiModel } from '@/shared/config/gemini'
import { supabase } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth'
import type { ProjectTipo } from '@/entities/project/model/types'

interface IdeiaEstruturada {
  nome: string
  descricao: string
  contexto_ia: string
  iteracao_nome: string
}

async function estruturarIdeia(ideia: string, tipo: ProjectTipo): Promise<IdeiaEstruturada> {
  const model = getGeminiModel()

  const prompt = `Você recebeu uma ideia de projeto de software descrita livremente por um usuário.
Seu trabalho é estruturá-la como um projeto profissional, de forma clara e objetiva.

Ideia do usuário: "${ideia}"
Tipo de projeto: ${tipo}

Responda APENAS com JSON válido (sem markdown, sem explicações), neste formato exato:
{
  "nome": "nome curto do projeto (máx 5 palavras, sem artigos desnecessários)",
  "descricao": "descrição em 1-2 frases, clara e direta, sem jargão técnico",
  "contexto_ia": "resumo técnico para uso interno da IA: tipo do produto, problema que resolve, público-alvo e principais funcionalidades esperadas",
  "iteracao_nome": "nome da primeira iteração (ex: MVP, Sprint 1, Fase 1)"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as IdeiaEstruturada
}

export function useOnboarding() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ ideia, tipo }: { ideia: string; tipo: ProjectTipo }) => {
      // 1. Gemini estrutura a ideia
      const estruturada = await estruturarIdeia(ideia, tipo)

      // 2. Cria o projeto
      const { data: projeto, error: projetoError } = await supabase
        .from('projetos')
        .insert({
          nome: estruturada.nome,
          descricao: estruturada.descricao,
          tipo,
          contexto_ia: estruturada.contexto_ia,
          empresa_id: user!.empresaId,
        })
        .select()
        .single()

      if (projetoError) throw projetoError

      // 3. Cria a primeira iteração já ativa
      const { error: iteracaoError } = await supabase
        .from('iteracoes')
        .insert({
          projeto_id: projeto.id,
          nome: estruturada.iteracao_nome,
          status: 'ativa',
          ordem: 1,
          empresa_id: user!.empresaId,
        })

      if (iteracaoError) throw iteracaoError

      return projeto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
    },
  })
}

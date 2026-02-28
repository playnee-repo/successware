import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type {
  Atividade,
  ConfiguracaoAtividade,
  Artefato,
  ArtefatoTipo,
  ApprovalStatus,
  ViewPreference,
  Disciplina,
  AtividadeComProgresso,
} from '@/entities/artifact/model/types'

// ==============================
// DISCIPLINAS (distinct from DB)
// ==============================
export function useDisciplinas() {
  return useQuery({
    queryKey: ['disciplinas'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('atividades')
        .select('disciplina')
        .order('disciplina')
      if (error) throw error
      const unique = [...new Set((data as { disciplina: string }[]).map(r => r.disciplina))]
      return unique
    },
  })
}

// ==============================
// ATIVIDADES
// ==============================
export function useAtividades(disciplina?: Disciplina) {
  return useQuery({
    queryKey: ['atividades', disciplina],
    queryFn: async (): Promise<Atividade[]> => {
      let query = supabase.from('atividades').select('*').order('ordem')
      if (disciplina) {
        query = query.eq('disciplina', disciplina)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Atividade[]
    },
  })
}

// ==============================
// ATIVIDADE (single)
// ==============================
export function useAtividade(atividadeId: string | undefined) {
  return useQuery({
    queryKey: ['atividade', atividadeId],
    queryFn: async (): Promise<Atividade> => {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .eq('id', atividadeId!)
        .single()
      if (error) throw error
      return data as Atividade
    },
    enabled: !!atividadeId,
  })
}

// ==============================
// CONFIGURAÇÕES DE ATIVIDADE
// ==============================
export function useConfiguracoesAtividade(atividadeId?: string) {
  return useQuery({
    queryKey: ['configuracoes', atividadeId],
    queryFn: async (): Promise<ConfiguracaoAtividade[]> => {
      let query = supabase.from('configuracoes_atividade').select('*')
      if (atividadeId) {
        query = query.eq('atividade_id', atividadeId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as ConfiguracaoAtividade[]
    },
    enabled: !!atividadeId,
  })
}

/** @deprecated Use useConfiguracoesAtividade instead */
export const useDefinicoes = useConfiguracoesAtividade

// ==============================
// ARTEFATOS DO PROJETO
// ==============================
export function useArtefato(artefatoId: string | undefined) {
  return useQuery({
    queryKey: ['artefato', artefatoId],
    queryFn: async (): Promise<Artefato> => {
      const { data, error } = await supabase
        .from('artefatos')
        .select('*')
        .eq('id', artefatoId!)
        .single()
      if (error) throw error
      return data as Artefato
    },
    enabled: !!artefatoId,
  })
}

/** @deprecated Use useArtefato instead */
export const useInsumo = useArtefato

export function useArtefatos(iteracaoId: string, atividadeId?: string) {
  return useQuery({
    queryKey: ['artefatos', iteracaoId, atividadeId],
    queryFn: async (): Promise<Artefato[]> => {
      let query = supabase
        .from('artefatos')
        .select('*')
        .eq('iteracao_id', iteracaoId)
        .order('versao', { ascending: false })

      if (atividadeId) {
        query = query.eq('atividade_id', atividadeId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Artefato[]
    },
    enabled: !!iteracaoId,
  })
}

/** @deprecated Use useArtefatos instead */
export const useInsumos = useArtefatos

// ==============================
// ATIVIDADES COM PROGRESSO
// ==============================
export function useAtividadesComProgresso(disciplina: Disciplina, iteracaoId: string) {
  return useQuery({
    queryKey: ['atividades-progresso', disciplina, iteracaoId],
    queryFn: async (): Promise<AtividadeComProgresso[]> => {
      const [atividadesRes, configuracoesRes, artefatosRes] = await Promise.all([
        supabase.from('atividades').select('*').eq('disciplina', disciplina).order('ordem'),
        supabase.from('configuracoes_atividade').select('*'),
        supabase.from('artefatos').select('*').eq('iteracao_id', iteracaoId).order('versao', { ascending: false }),
      ])

      if (atividadesRes.error) throw atividadesRes.error
      if (configuracoesRes.error) throw configuracoesRes.error
      if (artefatosRes.error) throw artefatosRes.error

      const atividades = atividadesRes.data as Atividade[]
      const configuracoes = configuracoesRes.data as ConfiguracaoAtividade[]
      const artefatos = artefatosRes.data as Artefato[]

      return atividades.map((atividade) => {
        const atividadeConfiguracoes = configuracoes.filter(c => c.atividade_id === atividade.id)
        const atividadeArtefatos = artefatos.filter(a => a.atividade_id === atividade.id)

        // Agrupar por nome e pegar o mais recente de cada grupo
        const artefatosPorNome = new Map<string, Artefato>()
        for (const artefato of atividadeArtefatos) {
          if (!artefatosPorNome.has(artefato.nome)) {
            // Como a query já está ordenada desc por versão, o primeiro é o mais recente
            artefatosPorNome.set(artefato.nome, artefato)
          }
        }

        const artefatosUnicos = Array.from(artefatosPorNome.values())
        const totalArtefatos = artefatosUnicos.length
        const artefatosAprovados = artefatosUnicos.filter(a => a.status_aprovacao === 'aprovado').length

        const progresso = totalArtefatos > 0
          ? Math.round((artefatosAprovados / totalArtefatos) * 100)
          : 0

        return {
          ...atividade,
          configuracoes: atividadeConfiguracoes,
          artefatos: atividadeArtefatos,
          progresso,
          total_artefatos: totalArtefatos,
          artefatos_aprovados: artefatosAprovados,
        }
      })
    },
    enabled: !!iteracaoId,
  })
}

// ==============================
// ATUALIZAR STATUS DE APROVAÇÃO
// ==============================
export function useUpdateApprovalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      artefatoId,
      status,
      iteracaoId,
    }: {
      artefatoId: string
      status: ApprovalStatus
      iteracaoId: string
    }): Promise<Artefato> => {
      const { data, error } = await supabase
        .from('artefatos')
        .update({ status_aprovacao: status })
        .eq('id', artefatoId)
        .select()
        .single()

      if (error) throw error
      return data as Artefato
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

// ==============================
// ATUALIZAR CONTEÚDO DO ARTEFATO
// ==============================
export function useUpdateArtefatoContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      artefatoId,
      conteudo_json,
      iteracaoId,
    }: {
      artefatoId: string
      conteudo_json: Record<string, unknown>
      iteracaoId: string
    }): Promise<Artefato> => {
      const { data, error } = await supabase
        .from('artefatos')
        .update({ conteudo_json })
        .eq('id', artefatoId)
        .select()
        .single()

      if (error) throw error
      return data as Artefato
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefato', variables.artefatoId] })
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

/** @deprecated Use useUpdateArtefatoContent instead */
export const useUpdateInsumoContent = useUpdateArtefatoContent

// ==============================
// CRIAR ARTEFATO (não-IA)
// ==============================
export function useCreateArtefato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      iteracao_id,
      atividade_id,
      configuracao_id,
      nome,
      tipo,
      conteudo_json,
      status_aprovacao,
    }: {
      iteracao_id: string
      atividade_id: string
      configuracao_id: string | null
      nome: string
      tipo: ArtefatoTipo
      conteudo_json: Record<string, unknown>
      status_aprovacao: ApprovalStatus
    }): Promise<Artefato> => {
      const { data, error } = await supabase
        .from('artefatos')
        .insert({
          iteracao_id,
          atividade_id,
          configuracao_id,
          nome,
          tipo,
          conteudo_json,
          versao: 1,
          agente_autor: 'usuario',
          status_aprovacao,
          preferencia_view: 'visual',
        })
        .select()
        .single()
      if (error) throw error
      return data as Artefato
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', vars.iteracao_id] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

// ==============================
// ATUALIZAR PREFERÊNCIA DE VIEW
// ==============================
export function useUpdateViewPreference() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      artefatoId,
      preference,
      iteracaoId,
    }: {
      artefatoId: string
      preference: ViewPreference
      iteracaoId: string
    }): Promise<Artefato> => {
      const { data, error } = await supabase
        .from('artefatos')
        .update({ preferencia_view: preference })
        .eq('id', artefatoId)
        .select()
        .single()

      if (error) throw error
      return data as Artefato
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracaoId] })
    },
  })
}

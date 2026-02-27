import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type {
  Atividade,
  DefinicaoInsumo,
  InsumoProject,
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
// DEFINIÇÕES DE INSUMOS
// ==============================
export function useDefinicoes(atividadeId?: string) {
  return useQuery({
    queryKey: ['definicoes', atividadeId],
    queryFn: async (): Promise<DefinicaoInsumo[]> => {
      let query = supabase.from('definicoes_insumos').select('*')
      if (atividadeId) {
        query = query.eq('atividade_id', atividadeId)
      }
      const { data, error } = await query
      if (error) throw error
      return data as DefinicaoInsumo[]
    },
    enabled: !!atividadeId,
  })
}

// ==============================
// INSUMOS DO PROJETO
// ==============================
export function useInsumo(insumoId: string | undefined) {
  return useQuery({
    queryKey: ['insumo', insumoId],
    queryFn: async (): Promise<InsumoProject> => {
      const { data, error } = await supabase
        .from('insumos_projeto')
        .select('*')
        .eq('id', insumoId!)
        .single()
      if (error) throw error
      return data as InsumoProject
    },
    enabled: !!insumoId,
  })
}

export function useInsumos(iteracaoId: string, atividadeId?: string) {
  return useQuery({
    queryKey: ['insumos', iteracaoId, atividadeId],
    queryFn: async (): Promise<InsumoProject[]> => {
      let query = supabase
        .from('insumos_projeto')
        .select('*')
        .eq('iteracao_id', iteracaoId)
        .order('versao', { ascending: false })

      if (atividadeId) {
        query = query.eq('atividade_id', atividadeId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as InsumoProject[]
    },
    enabled: !!iteracaoId,
  })
}

// ==============================
// ATIVIDADES COM PROGRESSO
// ==============================
export function useAtividadesComProgresso(disciplina: Disciplina, iteracaoId: string) {
  return useQuery({
    queryKey: ['atividades-progresso', disciplina, iteracaoId],
    queryFn: async (): Promise<AtividadeComProgresso[]> => {
      const [atividadesRes, definicoesRes, insumosRes] = await Promise.all([
        supabase.from('atividades').select('*').eq('disciplina', disciplina).order('ordem'),
        supabase.from('definicoes_insumos').select('*'),
        supabase.from('insumos_projeto').select('*').eq('iteracao_id', iteracaoId),
      ])

      if (atividadesRes.error) throw atividadesRes.error
      if (definicoesRes.error) throw definicoesRes.error
      if (insumosRes.error) throw insumosRes.error

      const atividades = atividadesRes.data as Atividade[]
      const definicoes = definicoesRes.data as DefinicaoInsumo[]
      const insumos = insumosRes.data as InsumoProject[]

      return atividades.map((atividade) => {
        const atividadeDefinicoes = definicoes.filter(d => d.atividade_id === atividade.id)
        const atividadeInsumos = insumos.filter(i => i.atividade_id === atividade.id)

        const totalInsumos = atividadeDefinicoes.length
        const insumosAprovados = atividadeInsumos.filter(i => i.status_aprovacao === 'aprovado').length

        const progresso = totalInsumos > 0
          ? Math.round((insumosAprovados / totalInsumos) * 100)
          : 0

        return {
          ...atividade,
          definicoes: atividadeDefinicoes,
          insumos: atividadeInsumos,
          progresso,
          total_insumos: totalInsumos,
          insumos_aprovados: insumosAprovados,
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
      insumoId,
      status,
      iteracaoId,
    }: {
      insumoId: string
      status: ApprovalStatus
      iteracaoId: string
    }): Promise<InsumoProject> => {
      const { data, error } = await supabase
        .from('insumos_projeto')
        .update({ status_aprovacao: status })
        .eq('id', insumoId)
        .select()
        .single()

      if (error) throw error
      return data as InsumoProject
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insumos', variables.iteracaoId] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })
}

// ==============================
// ATUALIZAR CONTEÚDO DO INSUMO
// ==============================
export function useUpdateInsumoContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      insumoId,
      conteudo_json,
      iteracaoId,
    }: {
      insumoId: string
      conteudo_json: Record<string, unknown>
      iteracaoId: string
    }): Promise<InsumoProject> => {
      const { data, error } = await supabase
        .from('insumos_projeto')
        .update({ conteudo_json })
        .eq('id', insumoId)
        .select()
        .single()

      if (error) throw error
      return data as InsumoProject
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insumo', variables.insumoId] })
      queryClient.invalidateQueries({ queryKey: ['insumos', variables.iteracaoId] })
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
      insumoId,
      preference,
      iteracaoId,
    }: {
      insumoId: string
      preference: ViewPreference
      iteracaoId: string
    }): Promise<InsumoProject> => {
      const { data, error } = await supabase
        .from('insumos_projeto')
        .update({ preferencia_view: preference })
        .eq('id', insumoId)
        .select()
        .single()

      if (error) throw error
      return data as InsumoProject
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insumos', variables.iteracaoId] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { Database } from '@/shared/api/supabase'

type ConfiguracaoRow = Database['public']['Tables']['configuracoes_atividade']['Row']
type ConfiguracaoInsert = Database['public']['Tables']['configuracoes_atividade']['Insert']
type ConfiguracaoUpdate = Database['public']['Tables']['configuracoes_atividade']['Update']

export type ConfiguracaoComAtividade = ConfiguracaoRow & {
  atividades: {
    id: string
    nome: string
    disciplina: string
    ordem: number
  }
}

/** @deprecated Use ConfiguracaoComAtividade instead */
export type DefinicaoComAtividade = ConfiguracaoComAtividade

const QK = ['admin', 'configuracoes'] as const

export function useAllConfiguracoesComAtividade() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_atividade')
        .select('*, atividades(id, nome, disciplina, ordem)')
        .order('criado_em')
      if (error) throw error
      return data as ConfiguracaoComAtividade[]
    },
  })
}

/** @deprecated Use useAllConfiguracoesComAtividade instead */
export const useAllDefinicoesComAtividade = useAllConfiguracoesComAtividade

export function useConfiguracoesAtividadeAdmin(atividadeId: string | null) {
  return useQuery({
    queryKey: [...QK, 'by-atividade', atividadeId],
    enabled: !!atividadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_atividade')
        .select('*, atividades(id, nome, disciplina, ordem)')
        .eq('atividade_id', atividadeId!)
        .order('criado_em')
      if (error) throw error
      return data as ConfiguracaoComAtividade[]
    },
  })
}

/** @deprecated Use useConfiguracoesAtividadeAdmin instead */
export const useDefinicoesByAtividade = useConfiguracoesAtividadeAdmin

export function useCreateConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ConfiguracaoInsert) => {
      const { data, error } = await supabase
        .from('configuracoes_atividade')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as ConfiguracaoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useCreateConfiguracao instead */
export const useCreateDefinicao = useCreateConfiguracao

export function useUpdateConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: ConfiguracaoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('configuracoes_atividade')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ConfiguracaoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useUpdateConfiguracao instead */
export const useUpdateDefinicao = useUpdateConfiguracao

export function useDeleteConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('configuracoes_atividade').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useDeleteConfiguracao instead */
export const useDeleteDefinicao = useDeleteConfiguracao

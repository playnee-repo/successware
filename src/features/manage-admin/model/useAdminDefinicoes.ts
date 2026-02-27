import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { Database } from '@/shared/api/supabase'

type DefinicaoRow = Database['public']['Tables']['definicoes_insumos']['Row']
type DefinicaoInsert = Database['public']['Tables']['definicoes_insumos']['Insert']
type DefinicaoUpdate = Database['public']['Tables']['definicoes_insumos']['Update']

export type DefinicaoComAtividade = DefinicaoRow & {
  atividades: {
    id: string
    nome: string
    disciplina: string
    ordem: number
  }
}

const QK = ['admin', 'definicoes'] as const

export function useAllDefinicoesComAtividade() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('definicoes_insumos')
        .select('*, atividades(id, nome, disciplina, ordem)')
        .order('criado_em')
      if (error) throw error
      return data as DefinicaoComAtividade[]
    },
  })
}

export function useDefinicoesByAtividade(atividadeId: string | null) {
  return useQuery({
    queryKey: [...QK, 'by-atividade', atividadeId],
    enabled: !!atividadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('definicoes_insumos')
        .select('*, atividades(id, nome, disciplina, ordem)')
        .eq('atividade_id', atividadeId!)
        .order('criado_em')
      if (error) throw error
      return data as DefinicaoComAtividade[]
    },
  })
}

export function useCreateDefinicao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DefinicaoInsert) => {
      const { data, error } = await supabase
        .from('definicoes_insumos')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as DefinicaoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateDefinicao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: DefinicaoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('definicoes_insumos')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DefinicaoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteDefinicao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('definicoes_insumos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

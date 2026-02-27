import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { Database } from '@/shared/api/supabase'

type AtividadeRow = Database['public']['Tables']['atividades']['Row']
type AtividadeInsert = Database['public']['Tables']['atividades']['Insert']
type AtividadeUpdate = Database['public']['Tables']['atividades']['Update']

const QK = ['admin', 'atividades'] as const

export function useAllAtividades() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .order('disciplina')
        .order('ordem')
      if (error) throw error
      return data as AtividadeRow[]
    },
  })
}

export function useCreateAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AtividadeInsert) => {
      const { data, error } = await supabase
        .from('atividades')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as AtividadeRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: AtividadeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('atividades')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as AtividadeRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atividades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

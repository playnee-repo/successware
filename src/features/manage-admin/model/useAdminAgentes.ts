import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { AgenteConfig } from '@/entities/admin/model/types'

const QK = ['admin', 'agentes'] as const

export function useAllAgentes() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agentes_config')
        .select('*')
        .order('id')
      if (error) throw error
      return data as AgenteConfig[]
    },
  })
}

export function useAgente(id: string | undefined) {
  return useQuery({
    queryKey: [...QK, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agentes_config')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as AgenteConfig
    },
    enabled: !!id,
  })
}

export function useCreateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<AgenteConfig, 'atualizado_em'>) => {
      const { data, error } = await supabase
        .from('agentes_config')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as AgenteConfig
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AgenteConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('agentes_config')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as AgenteConfig
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agentes_config').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

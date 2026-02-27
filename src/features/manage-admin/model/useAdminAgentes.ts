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

export function useRenameAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ oldId, newId }: { oldId: string; newId: string }) => {
      // 1. Fetch current config
      const { data: agente, error: fetchErr } = await supabase
        .from('agentes_config')
        .select('*')
        .eq('id', oldId)
        .single()
      if (fetchErr) throw fetchErr

      // 2. Insert with new ID (omit atualizado_em, let DB handle)
      const { atualizado_em, ...rest } = agente as AgenteConfig & { atualizado_em: string | null }
      void atualizado_em
      const { error: insertErr } = await supabase
        .from('agentes_config')
        .insert({ ...rest, id: newId })
      if (insertErr) throw insertErr

      // 3. Update references in related tables
      await supabase.from('atividades').update({ agente: newId }).eq('agente', oldId)
      await supabase.from('definicoes_insumos').update({ agente_responsavel: newId }).eq('agente_responsavel', oldId)

      // 4. Delete old row
      const { error: delErr } = await supabase.from('agentes_config').delete().eq('id', oldId)
      if (delErr) throw delErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      qc.invalidateQueries({ queryKey: ['admin', 'atividades'] })
      qc.invalidateQueries({ queryKey: ['admin', 'definicoes'] })
    },
  })
}

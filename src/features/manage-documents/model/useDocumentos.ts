import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { Database } from '@/shared/api/supabase'

type DocumentoRow = Database['public']['Tables']['documentos_projeto']['Row']
type DocumentoInsert = Database['public']['Tables']['documentos_projeto']['Insert']

export type Documento = DocumentoRow

function qk(projectId: string) {
  return ['documentos', projectId] as const
}

export function useDocumentos(projectId: string | undefined) {
  return useQuery({
    queryKey: ['documentos', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_projeto')
        .select('*')
        .eq('projeto_id', projectId!)
        .order('ordem')
        .order('criado_em')
      if (error) throw error
      return data as DocumentoRow[]
    },
    enabled: !!projectId,
  })
}

export function useCreateDocumento(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<DocumentoInsert, 'projeto_id'>) => {
      const { data, error } = await supabase
        .from('documentos_projeto')
        .insert({ ...payload, projeto_id: projectId })
        .select()
        .single()
      if (error) throw error
      return data as DocumentoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

export function useUpdateDocumento(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DocumentoRow> & { id: string }) => {
      const { data, error } = await supabase
        .from('documentos_projeto')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DocumentoRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

export function useDeleteDocumento(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documentos_projeto')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

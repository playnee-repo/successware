import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth'
import { documentoService } from '@/shared/api/container'
import type { Documento, CreateDocumentoInput } from '@/entities/document/model/types'

export type { Documento }

function qk(projectId: string) {
  return ['documentos', projectId] as const
}

export function useDocumentos(projectId: string | undefined) {
  return useQuery({
    queryKey: ['documentos', projectId],
    queryFn: () => documentoService.findByProjeto(projectId!),
    enabled: !!projectId,
  })
}

export function useCreateDocumento(projectId: string) {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: (payload: CreateDocumentoInput) =>
      documentoService.create(projectId, payload, user!.empresaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

export function useUpdateDocumento(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Documento> & { id: string }) =>
      documentoService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

export function useDeleteDocumento(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentoService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk(projectId) }),
  })
}

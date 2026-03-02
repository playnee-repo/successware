import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/shared/api/container'
import type { AgenteConfig } from '@/entities/admin/model/types'

const QK = ['admin', 'agentes'] as const

export function useAllAgentes() {
  return useQuery({
    queryKey: QK,
    queryFn: () => adminService.getAllAgentes(),
  })
}

export function useAgente(id: string | undefined) {
  return useQuery({
    queryKey: [...QK, id],
    queryFn: () => adminService.getAgente(id!),
    enabled: !!id,
  })
}

export function useCreateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<AgenteConfig, 'atualizado_em'>) =>
      adminService.createAgente(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<AgenteConfig> & { id: string }) =>
      adminService.updateAgente(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAgente(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useRenameAgente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ oldId, newId }: { oldId: string; newId: string }) =>
      adminService.renameAgente(oldId, newId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      qc.invalidateQueries({ queryKey: ['admin', 'atividades'] })
      qc.invalidateQueries({ queryKey: ['admin', 'configuracoes'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/shared/api/container'
import type { Atividade } from '@/entities/artifact/model/types'

type AtividadeRow = Atividade
type AtividadeInsert = Omit<Atividade, 'id' | 'criado_em'>
type AtividadeUpdate = Partial<Omit<Atividade, 'id' | 'criado_em'>>

export type { AtividadeRow, AtividadeInsert, AtividadeUpdate }

const QK = ['admin', 'atividades'] as const

export function useAllAtividades() {
  return useQuery({
    queryKey: QK,
    queryFn: () => adminService.getAllAtividades(),
  })
}

export function useCreateAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AtividadeInsert) => adminService.createAtividade(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: AtividadeUpdate & { id: string }) =>
      adminService.updateAtividade(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteAtividade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAtividade(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useRenameDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) =>
      adminService.renameDisciplina(oldName, newName),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

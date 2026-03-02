import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/shared/api/container'
import type { ConfiguracaoAtividade } from '@/entities/artifact/model/types'
import type { ConfiguracaoComAtividade } from '@/entities/artifact/api/IConfiguracaoRepository'

export type { ConfiguracaoComAtividade }

/** @deprecated Use ConfiguracaoComAtividade instead */
export type DefinicaoComAtividade = ConfiguracaoComAtividade

type ConfiguracaoInsert = Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>
type ConfiguracaoUpdate = Partial<Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>>

const QK = ['admin', 'configuracoes'] as const

export function useAllConfiguracoesComAtividade() {
  return useQuery({
    queryKey: QK,
    queryFn: () => adminService.getAllConfiguracoes(),
  })
}

/** @deprecated Use useAllConfiguracoesComAtividade instead */
export const useAllDefinicoesComAtividade = useAllConfiguracoesComAtividade

export function useConfiguracoesAtividadeAdmin(atividadeId: string | null) {
  return useQuery({
    queryKey: [...QK, 'by-atividade', atividadeId],
    enabled: !!atividadeId,
    queryFn: () => adminService.getConfiguracoesByAtividade(atividadeId!),
  })
}

/** @deprecated Use useConfiguracoesAtividadeAdmin instead */
export const useDefinicoesByAtividade = useConfiguracoesAtividadeAdmin

export function useCreateConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfiguracaoInsert) => adminService.createConfiguracao(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useCreateConfiguracao instead */
export const useCreateDefinicao = useCreateConfiguracao

export function useUpdateConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: ConfiguracaoUpdate & { id: string }) =>
      adminService.updateConfiguracao(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useUpdateConfiguracao instead */
export const useUpdateDefinicao = useUpdateConfiguracao

export function useDeleteConfiguracao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteConfiguracao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

/** @deprecated Use useDeleteConfiguracao instead */
export const useDeleteDefinicao = useDeleteConfiguracao

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth'
import { iteracaoService } from '@/shared/api/container'
import type { CreateIterationInput } from '@/entities/iteration/model/types'

export function useIterations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['iteracoes', projectId],
    queryFn: () => iteracaoService.findByProjeto(projectId!),
    enabled: !!projectId,
  })
}

export function useCreateIteration() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: CreateIterationInput) =>
      iteracaoService.create(input, user!.empresaId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['iteracoes', data.projeto_id] })
    },
  })
}

export function useActivateIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ iteracaoId, projetoId }: { iteracaoId: string; projetoId: string }) =>
      iteracaoService.activate(iteracaoId, projetoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['iteracoes', variables.projetoId] })
    },
  })
}

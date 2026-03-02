import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth'
import { executeAiService } from '@/shared/api/container'
import type { ExecuteAiParams } from './ExecuteAiService'

export function useExecuteAi() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)

  const mutation = useMutation({
    mutationFn: (params: Omit<ExecuteAiParams, 'empresaId'>) =>
      executeAiService.execute({ ...params, empresaId: user!.empresaId }),
    onMutate: () => {
      setIsStreaming(true)
    },
    onSettled: () => {
      setIsStreaming(false)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artefatos', variables.iteracao.id] })
      queryClient.invalidateQueries({ queryKey: ['mensagens', variables.iteracao.id] })
      queryClient.invalidateQueries({ queryKey: ['atividades-progresso'] })
    },
  })

  return {
    execute: mutation.mutateAsync,
    isExecuting: mutation.isPending || isStreaming,
    error: mutation.error,
    reset: mutation.reset,
  }
}

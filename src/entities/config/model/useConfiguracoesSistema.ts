import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configuracaoSistemaService } from '@/shared/api/container'

// Chaves conhecidas — adicione novas features aqui
export const CONFIG_KEYS = {
  ADVISOR_ENABLED: 'advisor_enabled',
  ADVISOR_COOLDOWN_MINUTES: 'advisor_cooldown_minutes',
} as const

export type ConfigChave = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS]

export type Configuracoes = {
  advisor_enabled: boolean
  advisor_cooldown_minutes: number
}

const QUERY_KEY = ['configuracoes_sistema'] as const

export function useConfiguracoesSistema() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => configuracaoSistemaService.fetchConfiguracoes<Configuracoes>(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSetConfiguracao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chave, valor }: { chave: ConfigChave; valor: unknown }) =>
      configuracaoSistemaService.set(chave, valor),
    onMutate: async ({ chave, valor }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })
      const previous = queryClient.getQueryData<Configuracoes>(QUERY_KEY)
      queryClient.setQueryData<Configuracoes>(QUERY_KEY, (old) => ({
        ...(old ?? { advisor_enabled: true, advisor_cooldown_minutes: 5 }),
        [chave]: valor,
      } as Configuracoes))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

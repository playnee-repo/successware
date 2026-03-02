import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth'
import { onboardingService } from '@/shared/api/container'
import type { ProjectTipo } from '@/entities/project/model/types'

export function useOnboarding() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ ideia, tipo }: { ideia: string; tipo: ProjectTipo }) =>
      onboardingService.createFromIdeia(ideia, tipo, user!.empresaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
    },
  })
}

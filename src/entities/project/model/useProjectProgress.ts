import { useQuery } from '@tanstack/react-query'
import { projetoService } from '@/shared/api/container'
export type { DisciplinaProgresso } from './types'

export function useProjectProgress(projectId: string) {
  return useQuery({
    queryKey: ['progresso-projeto', projectId],
    queryFn: () => projetoService.getProgress(projectId),
    enabled: !!projectId,
  })
}

export function calcularProgressoGlobal(disciplinas: { progresso: number }[]): number {
  if (!disciplinas.length) return 0
  const soma = disciplinas.reduce((acc, d) => acc + d.progresso, 0)
  return Math.round(soma / disciplinas.length)
}

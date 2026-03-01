import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export interface DisciplinaProgresso {
  disciplina: string
  total_artefatos: number
  aprovados: number
  progresso: number
}

export function useProjectProgress(projectId: string) {
  return useQuery({
    queryKey: ['progresso-projeto', projectId],
    queryFn: async (): Promise<DisciplinaProgresso[]> => {
      const { data, error } = await supabase
        .rpc('progresso_projeto', { p_projeto_id: projectId })
      if (error) throw error
      return data as DisciplinaProgresso[]
    },
    enabled: !!projectId,
  })
}

export function calcularProgressoGlobal(disciplinas: DisciplinaProgresso[]): number {
  if (!disciplinas.length) return 0
  const soma = disciplinas.reduce((acc, d) => acc + d.progresso, 0)
  return Math.round(soma / disciplinas.length)
}

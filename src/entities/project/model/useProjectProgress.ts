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
  const comAtividade = disciplinas.filter(d => d.total_artefatos > 0)
  if (!comAtividade.length) return 0
  const soma = comAtividade.reduce((acc, d) => acc + d.progresso, 0)
  return Math.round(soma / comAtividade.length)
}

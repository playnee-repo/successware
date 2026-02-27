import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'
import type { Iteration, CreateIterationInput } from '@/entities/iteration/model/types'

export function useIterations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['iteracoes', projectId],
    queryFn: async (): Promise<Iteration[]> => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('iteracoes')
        .select('*')
        .eq('projeto_id', projectId)
        .order('ordem', { ascending: true })
      if (error) throw error
      return data as Iteration[]
    },
    enabled: !!projectId,
  })
}

export function useCreateIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateIterationInput): Promise<Iteration> => {
      // Get current max ordem
      const { data: existing } = await supabase
        .from('iteracoes')
        .select('ordem')
        .eq('projeto_id', input.projeto_id)
        .order('ordem', { ascending: false })
        .limit(1)

      const nextOrdem = existing && existing.length > 0 ? existing[0].ordem + 1 : 1

      const { data, error } = await supabase
        .from('iteracoes')
        .insert({ ...input, ordem: input.ordem ?? nextOrdem })
        .select()
        .single()

      if (error) throw error
      return data as Iteration
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['iteracoes', data.projeto_id] })
    },
  })
}

export function useActivateIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ iteracaoId, projetoId }: { iteracaoId: string; projetoId: string }) => {
      // Deactivate all others
      await supabase
        .from('iteracoes')
        .update({ status: 'planejada' })
        .eq('projeto_id', projetoId)
        .neq('id', iteracaoId)

      // Activate selected
      const { data, error } = await supabase
        .from('iteracoes')
        .update({ status: 'ativa' })
        .eq('id', iteracaoId)
        .select()
        .single()

      if (error) throw error
      return data as Iteration
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['iteracoes', variables.projetoId] })
    },
  })
}

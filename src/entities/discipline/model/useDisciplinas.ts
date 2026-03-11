import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplinaRepo } from '@/shared/api/container'
import type { Disciplina } from './types'

export function useDisciplinas() {
  return useQuery<Disciplina[]>({
    queryKey: ['disciplinas'],
    queryFn: () => disciplinaRepo.findAll(),
    staleTime: 5 * 60 * 1000, // 5 min — data é quase estática
  })
}

export function useCreateDisciplina() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; nome: string; descricao?: string | null; cor?: string; icone?: string | null; ordem?: number }) =>
      disciplinaRepo.create({
        id: data.id,
        nome: data.nome,
        descricao: data.descricao ?? null,
        cor: data.cor ?? 'indigo',
        icone: data.icone ?? null,
        ordem: data.ordem ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] })
    },
  })
}

export function useUpdateDisciplina() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Disciplina, 'id'>> }) =>
      disciplinaRepo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] })
    },
  })
}

/** Map id → Disciplina para lookup rápido. */
export function useDisciplinaMap() {
  const { data: disciplinas = [] } = useDisciplinas()
  const map = new Map<string, Disciplina>()
  for (const d of disciplinas) map.set(d.id, d)
  return map
}

// ─── Helpers de display (usam o map, com fallback seguro) ─────────────────

function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

/** Retorna o nome de exibição para uma disciplina. */
export function getDisciplinaLabel(map: Map<string, Disciplina>, id: string): string {
  return map.get(id)?.nome ?? toTitleCase(id)
}

/** Retorna a descrição da disciplina. */
export function getDisciplinaDescricao(map: Map<string, Disciplina>, id: string): string {
  return map.get(id)?.descricao ?? ''
}

/** Cor base (violet, indigo, blue, orange, emerald). Fallback: indigo. */
export function getDisciplinaCor(map: Map<string, Disciplina>, id: string): string {
  return map.get(id)?.cor ?? 'indigo'
}

// ─── CSS helpers derivados da cor ─────────────────────────────────────────

const COLOR_CLASSES: Record<string, { text: string; dot: string; bg: string; border: string; accent: string; gradient: string }> = {
  violet:  { text: 'text-violet-400',  dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  accent: 'card-accent-violet',  gradient: 'from-violet-600/10' },
  indigo:  { text: 'text-indigo-400',  dot: 'bg-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  accent: 'card-accent-indigo',  gradient: 'from-indigo-600/10' },
  blue:    { text: 'text-blue-400',    dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    accent: 'card-accent-blue',    gradient: 'from-blue-600/10' },
  orange:  { text: 'text-orange-400',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  accent: 'card-accent-orange',  gradient: 'from-orange-600/10' },
  emerald: { text: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', accent: 'card-accent-emerald', gradient: 'from-emerald-600/10' },
  cyan:    { text: 'text-cyan-400',    dot: 'bg-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    accent: '',                    gradient: 'from-cyan-600/10' },
}

const FALLBACK_CLASSES = COLOR_CLASSES.indigo

export function getDisciplinaClasses(map: Map<string, Disciplina>, id: string) {
  const cor = getDisciplinaCor(map, id)
  return COLOR_CLASSES[cor] ?? FALLBACK_CLASSES
}

const AGENTE_COLOR: Record<string, { bg: string; text: string; abbr: string }> = {
  SCRIBE: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', abbr: 'SC' },
  ARCH: { bg: 'bg-blue-500/20', text: 'text-blue-400', abbr: 'AR' },
  FORGE: { bg: 'bg-orange-500/20', text: 'text-orange-400', abbr: 'FG' },
  GUARDIAN: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', abbr: 'GD' },
}

export function getAgenteColor(id: string): { bg: string; text: string; abbr: string } {
  return AGENTE_COLOR[id] ?? { bg: 'bg-zinc-700/40', text: 'text-zinc-400', abbr: id.slice(0, 2).toUpperCase() }
}

export type IterationStatus = 'planejada' | 'ativa' | 'concluida'

export interface Iteration {
  id: string
  projeto_id: string
  nome: string
  modulo_foco: string | null
  status: IterationStatus
  ordem: number
  criado_em: string
  atualizado_em: string
}

export interface CreateIterationInput {
  projeto_id: string
  nome: string
  modulo_foco?: string
  ordem?: number
}

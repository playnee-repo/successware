export type ProjectStatus = 'ativo' | 'pausado' | 'concluido' | 'arquivado'

export interface Project {
  id: string
  nome: string
  descricao: string | null
  status: ProjectStatus
  empresa: string | null
  criado_em: string
  atualizado_em: string
}

export interface CreateProjectInput {
  nome: string
  descricao?: string
  empresa?: string
}

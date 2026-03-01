export type ProjectStatus = 'ativo' | 'pausado' | 'concluido' | 'arquivado'
export type ProjectTipo = 'startup_mvp' | 'saas' | 'app_mobile' | 'api' | 'sistema_interno' | 'outro'

export interface Project {
  id: string
  nome: string
  descricao: string | null
  status: ProjectStatus
  empresa: string | null
  tipo: ProjectTipo | null
  contexto_ia: string | null
  criado_em: string
  atualizado_em: string
}

export interface CreateProjectInput {
  nome: string
  descricao?: string
  empresa?: string
}

export type ApprovalStatus = 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado'
export type ViewPreference = 'visual' | 'rawjson'
export type ArtefatoTipo = 'texto' | 'link' | 'documento'
export type DefaultDisciplina = 'descoberta' | 'requisitos' | 'arquitetura' | 'construcao' | 'qualidade'
export type Disciplina = string

export interface CreateArtefatoInput {
  iteracao_id: string
  atividade_id: string
  configuracao_id: string | null
  nome: string
  tipo?: ArtefatoTipo
  conteudo_json: Record<string, unknown>
  versao: number
  agente_autor: string
  status_aprovacao: ApprovalStatus
  preferencia_view?: ViewPreference
  empresa_id: string | null
}

export interface Atividade {
  id: string
  disciplina: Disciplina
  nome: string
  descricao: string | null
  agente: string
  ordem: number
  icone: string | null
  criado_em: string
}

export interface ConfiguracaoAtividade {
  id: string
  atividade_id: string
  nome: string
  tipo_insumo: string
  agente_responsavel: string
  prompt_template: string | null
  tipos_projeto?: string[] | null  // null/undefined = todos os tipos
  criado_em: string
}

/** @deprecated Use ConfiguracaoAtividade instead */
export type DefinicaoInsumo = ConfiguracaoAtividade

export interface Artefato {
  id: string
  iteracao_id: string
  atividade_id: string
  configuracao_id: string | null
  nome: string
  tipo: ArtefatoTipo
  conteudo_json: Record<string, unknown>
  versao: number
  agente_autor: string
  status_aprovacao: ApprovalStatus
  preferencia_view: ViewPreference
  criado_em: string
  atualizado_em: string
}

/** @deprecated Use Artefato instead */
export type InsumoProject = Artefato

export interface AtividadeComProgresso extends Atividade {
  configuracoes: ConfiguracaoAtividade[]
  artefatos: Artefato[]
  progresso: number  // 0-100%
  total_artefatos: number
  artefatos_aprovados: number
}

/** @deprecated Use useDisciplinaMap() + getDisciplinaLabel() de entities/discipline */
export const DISCIPLINA_LABELS: Record<string, string> = {
  descoberta: 'Descoberta',
  requisitos: 'Requisitos',
  arquitetura: 'Arquitetura',
  construcao: 'Construção',
  qualidade: 'Qualidade',
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em Revisão',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

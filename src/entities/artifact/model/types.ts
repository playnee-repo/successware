export type ApprovalStatus = 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado'
export type ViewPreference = 'visual' | 'rawjson'
export type DefaultDisciplina = 'descoberta' | 'requisitos' | 'arquitetura' | 'construcao' | 'qualidade'
export type Disciplina = string

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

export interface DefinicaoInsumo {
  id: string
  atividade_id: string
  tipo_insumo: string
  agente_responsavel: string
  schema_metadado_json: Record<string, unknown> | null
  prompt_template: string | null
  criado_em: string
}

export interface InsumoProject {
  id: string
  iteracao_id: string
  atividade_id: string
  definicao_id: string
  conteudo_json: Record<string, unknown>
  versao: number
  agente_autor: string
  status_aprovacao: ApprovalStatus
  preferencia_view: ViewPreference
  criado_em: string
  atualizado_em: string
}

export interface AtividadeComProgresso extends Atividade {
  definicoes: DefinicaoInsumo[]
  insumos: InsumoProject[]
  progresso: number  // 0-100%
  total_insumos: number
  insumos_aprovados: number
}

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

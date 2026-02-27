export type AgentType = string
export type MessageType = 'user' | 'agent' | 'system' | 'action'

/** Contexto atual da tela para o chat (projeto, disciplina, resultado/insumo). */
export interface ChatContext {
  projectId?: string
  projectName?: string
  disciplina?: string
  /** Onde o usuário está: lista do projeto ou tela de resultado de um insumo. */
  route: 'project' | 'resultado'
  /** Preenchido quando route === 'resultado'. */
  insumoId?: string
  insumoName?: string
  /** Resumo curto para o agente (ex.: "Diagrama de Contexto v1"). */
  insumoSummary?: string
  /** Conteúdo atual do insumo (resumo em texto) para o agente sugerir melhorias. Só na tela de resultado. */
  insumoContentPreview?: string
}

export interface AgentMessage {
  id: string
  iteracao_id: string
  disciplina: string
  agente: string
  tipo: MessageType
  conteudo: string
  metadados_json: Record<string, unknown> | null
  criado_em: string
}

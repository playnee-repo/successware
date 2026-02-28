export type AgentType = string
export type MessageType = 'user' | 'agent' | 'system' | 'action'

/** Contexto atual da tela para o chat (projeto, disciplina, resultado/artefato). */
export interface ChatContext {
  projectId?: string
  projectName?: string
  disciplina?: string
  /** Onde o usuário está: lista do projeto ou tela de resultado de um artefato. */
  route: 'project' | 'resultado'
  /** Preenchido quando route === 'resultado'. */
  artefatoId?: string
  artefatoName?: string
  /** Resumo curto para o agente (ex.: "Épico: Autenticação v1"). */
  artefatoSummary?: string
  /** Conteúdo atual do artefato (resumo em texto) para o agente sugerir melhorias. Só na tela de resultado. */
  artefatoContentPreview?: string
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

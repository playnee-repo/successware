import type { AgentMessage, MessageType } from '../model/types'

export interface CreateMensagemInput {
  iteracao_id: string
  disciplina: string
  agente: string
  tipo: MessageType
  conteudo: string
  metadados_json?: Record<string, unknown> | null
  empresa_id?: string | null
}

export interface IMensagemRepository {
  findByIteracaoAndDisciplina(iteracaoId: string, disciplina: string): Promise<AgentMessage[]>
  create(input: CreateMensagemInput): Promise<AgentMessage>
}

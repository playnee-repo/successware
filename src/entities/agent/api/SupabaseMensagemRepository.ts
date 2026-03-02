import type { SupabaseClient } from '@supabase/supabase-js'
import type { IMensagemRepository, CreateMensagemInput } from './IMensagemRepository'
import type { AgentMessage } from '../model/types'

export class SupabaseMensagemRepository implements IMensagemRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByIteracaoAndDisciplina(iteracaoId: string, disciplina: string): Promise<AgentMessage[]> {
    const { data, error } = await this.client
      .from('mensagens_agente')
      .select('*')
      .eq('iteracao_id', iteracaoId)
      .eq('disciplina', disciplina)
      .order('criado_em', { ascending: true })
    if (error) throw error
    return data as AgentMessage[]
  }

  async create(input: CreateMensagemInput): Promise<AgentMessage> {
    const { data, error } = await this.client
      .from('mensagens_agente')
      .insert(input)
      .select()
      .single()
    if (error) throw error
    return data as AgentMessage
  }
}

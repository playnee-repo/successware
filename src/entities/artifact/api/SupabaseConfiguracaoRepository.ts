import type { SupabaseClient } from '@supabase/supabase-js'
import type { IConfiguracaoRepository, ConfiguracaoComAtividade } from './IConfiguracaoRepository'
import type { ConfiguracaoAtividade } from '../model/types'

export class SupabaseConfiguracaoRepository implements IConfiguracaoRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByAtividade(atividadeId?: string): Promise<ConfiguracaoAtividade[]> {
    let query = this.client.from('configuracoes_atividade').select('*')
    if (atividadeId) {
      query = query.eq('atividade_id', atividadeId)
    }
    const { data, error } = await query
    if (error) throw error
    return data as ConfiguracaoAtividade[]
  }

  async findAllWithAtividade(): Promise<ConfiguracaoComAtividade[]> {
    const { data, error } = await this.client
      .from('configuracoes_atividade')
      .select('*, atividades(id, nome, disciplina, ordem)')
      .order('criado_em')
    if (error) throw error
    return data as ConfiguracaoComAtividade[]
  }

  async findByAtividadeWithAtividade(atividadeId: string): Promise<ConfiguracaoComAtividade[]> {
    const { data, error } = await this.client
      .from('configuracoes_atividade')
      .select('*, atividades(id, nome, disciplina, ordem)')
      .eq('atividade_id', atividadeId)
      .order('criado_em')
    if (error) throw error
    return data as ConfiguracaoComAtividade[]
  }

  async create(payload: Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>): Promise<ConfiguracaoAtividade> {
    const { data, error } = await this.client
      .from('configuracoes_atividade')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as ConfiguracaoAtividade
  }

  async update(id: string, payload: Partial<Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>>): Promise<ConfiguracaoAtividade> {
    const { data, error } = await this.client
      .from('configuracoes_atividade')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ConfiguracaoAtividade
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('configuracoes_atividade').delete().eq('id', id)
    if (error) throw error
  }

  async updateAgenteResponsavel(oldAgentId: string, newAgentId: string): Promise<void> {
    const { error } = await this.client
      .from('configuracoes_atividade')
      .update({ agente_responsavel: newAgentId })
      .eq('agente_responsavel', oldAgentId)
    if (error) throw error
  }
}

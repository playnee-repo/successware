import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAgenteRepository } from './IAgenteRepository'
import type { AgenteConfig } from '@/entities/admin/model/types'

export class SupabaseAgenteRepository implements IAgenteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<AgenteConfig[]> {
    const { data, error } = await this.client
      .from('agentes_config')
      .select('*')
      .order('id')
    if (error) throw error
    return data as AgenteConfig[]
  }

  async findById(id: string): Promise<AgenteConfig | null> {
    const { data, error } = await this.client
      .from('agentes_config')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as AgenteConfig
  }

  async create(payload: Omit<AgenteConfig, 'atualizado_em'>): Promise<AgenteConfig> {
    const { data, error } = await this.client
      .from('agentes_config')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as AgenteConfig
  }

  async update(id: string, payload: Partial<AgenteConfig>): Promise<AgenteConfig> {
    const { data, error } = await this.client
      .from('agentes_config')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as AgenteConfig
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('agentes_config').delete().eq('id', id)
    if (error) throw error
  }
}

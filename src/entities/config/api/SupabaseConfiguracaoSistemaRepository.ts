import type { SupabaseClient } from '@supabase/supabase-js'
import type { IConfiguracaoSistemaRepository } from './IConfiguracaoSistemaRepository'

export class SupabaseConfiguracaoSistemaRepository implements IConfiguracaoSistemaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<{ chave: string; valor: unknown }[]> {
    const { data, error } = await this.client
      .from('configuracoes_sistema')
      .select('chave, valor')
    if (error) throw error
    return data as { chave: string; valor: unknown }[]
  }

  async set(chave: string, valor: unknown): Promise<void> {
    const { error } = await this.client.rpc('set_configuracao', {
      p_chave: chave,
      p_valor: valor as never,
    })
    if (error) throw error
  }
}

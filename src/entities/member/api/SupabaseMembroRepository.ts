import type { SupabaseClient } from '@supabase/supabase-js'
import type { IMembroRepository } from './IMembroRepository'
import type { Membro } from '../model/types'

export class SupabaseMembroRepository implements IMembroRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Membro[]> {
    const { data, error } = await this.client.rpc('listar_membros')
    if (error) throw error
    return data as Membro[]
  }

  async addByEmail(email: string, role: string): Promise<'ok' | 'not_found'> {
    const { data, error } = await this.client.rpc('adicionar_membro_por_email', {
      p_email: email,
      p_role: role,
    })
    if (error) throw new Error(error.message)
    return data as 'ok' | 'not_found'
  }

  async add(userId: string, role: string): Promise<void> {
    const { error } = await this.client.rpc('adicionar_membro', {
      p_user_id: userId,
      p_role: role,
    })
    if (error) throw new Error(error.message)
  }

  async remove(userId: string): Promise<void> {
    const { error } = await this.client.rpc('remover_membro', { p_user_id: userId })
    if (error) throw new Error(error.message)
  }
}

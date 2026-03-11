import type { SupabaseClient } from '@supabase/supabase-js'
import type { IDisciplinaRepository } from './IDisciplinaRepository'
import type { Disciplina } from '../model/types'

export class SupabaseDisciplinaRepository implements IDisciplinaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Disciplina[]> {
    const { data, error } = await this.client
      .from('disciplinas')
      .select('*')
      .order('ordem')
    if (error) throw error
    return data ?? []
  }

  async findById(id: string): Promise<Disciplina | null> {
    const { data, error } = await this.client
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async create(input: Omit<Disciplina, 'ordem'> & { ordem?: number }): Promise<Disciplina> {
    const { data, error } = await this.client
      .from('disciplinas')
      .insert(input)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, input: Partial<Omit<Disciplina, 'id'>>): Promise<Disciplina> {
    const { data, error } = await this.client
      .from('disciplinas')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('disciplinas')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

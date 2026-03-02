import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAtividadeRepository } from './IAtividadeRepository'
import type { Atividade } from '../model/types'

export class SupabaseAtividadeRepository implements IAtividadeRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(disciplina?: string): Promise<Atividade[]> {
    let query = this.client
      .from('atividades')
      .select('*')
      .order('disciplina')
      .order('ordem')
    if (disciplina) {
      query = query.eq('disciplina', disciplina)
    }
    const { data, error } = await query
    if (error) throw error
    return data as Atividade[]
  }

  async findById(id: string): Promise<Atividade> {
    const { data, error } = await this.client
      .from('atividades')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Atividade
  }

  async findDistinctDisciplinas(): Promise<string[]> {
    const { data, error } = await this.client
      .from('atividades')
      .select('disciplina')
      .order('disciplina')
    if (error) throw error
    const unique = [...new Set((data as { disciplina: string }[]).map(r => r.disciplina))]
    return unique
  }

  async create(payload: Omit<Atividade, 'id' | 'criado_em'>): Promise<Atividade> {
    const { data, error } = await this.client
      .from('atividades')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data as Atividade
  }

  async update(id: string, payload: Partial<Omit<Atividade, 'id' | 'criado_em'>>): Promise<Atividade> {
    const { data, error } = await this.client
      .from('atividades')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Atividade
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('atividades').delete().eq('id', id)
    if (error) throw error
  }

  async renameDisciplina(oldName: string, newName: string): Promise<void> {
    const { error } = await this.client
      .from('atividades')
      .update({ disciplina: newName })
      .eq('disciplina', oldName)
    if (error) throw error
  }

  async updateAgente(oldId: string, newId: string): Promise<void> {
    const { error } = await this.client
      .from('atividades')
      .update({ agente: newId })
      .eq('agente', oldId)
    if (error) throw error
  }
}

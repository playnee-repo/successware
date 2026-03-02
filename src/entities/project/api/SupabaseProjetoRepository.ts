import type { SupabaseClient } from '@supabase/supabase-js'
import type { IProjetoRepository } from './IProjetoRepository'
import type { Project, CreateProjectInput, DisciplinaProgresso } from '../model/types'

export class SupabaseProjetoRepository implements IProjetoRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projetos')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) throw error
    return data as Project[]
  }

  async findById(id: string): Promise<Project> {
    const { data, error } = await this.client
      .from('projetos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Project
  }

  async create(input: CreateProjectInput, empresaId: string): Promise<Project> {
    const { data, error } = await this.client
      .from('projetos')
      .insert({ ...input, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    return data as Project
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('projetos').delete().eq('id', id)
    if (error) throw error
  }

  async getProgress(projetoId: string): Promise<DisciplinaProgresso[]> {
    const { data, error } = await this.client
      .rpc('progresso_projeto', { p_projeto_id: projetoId })
    if (error) throw error
    return data as DisciplinaProgresso[]
  }
}

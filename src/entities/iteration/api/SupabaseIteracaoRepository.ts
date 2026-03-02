import type { SupabaseClient } from '@supabase/supabase-js'
import type { IIteracaoRepository } from './IIteracaoRepository'
import type { Iteration, CreateIterationInput } from '../model/types'

export class SupabaseIteracaoRepository implements IIteracaoRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByProjeto(projetoId: string): Promise<Iteration[]> {
    const { data, error } = await this.client
      .from('iteracoes')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: true })
    if (error) throw error
    return data as Iteration[]
  }

  async findMaxOrdem(projetoId: string): Promise<number> {
    const { data } = await this.client
      .from('iteracoes')
      .select('ordem')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: false })
      .limit(1)
    return data && data.length > 0 ? data[0].ordem : 0
  }

  async create(input: CreateIterationInput, empresaId: string, ordem: number): Promise<Iteration> {
    const { data, error } = await this.client
      .from('iteracoes')
      .insert({ ...input, ordem, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    return data as Iteration
  }

  async activate(iteracaoId: string): Promise<Iteration> {
    const { data, error } = await this.client
      .from('iteracoes')
      .update({ status: 'ativa' })
      .eq('id', iteracaoId)
      .select()
      .single()
    if (error) throw error
    return data as Iteration
  }

  async deactivateOthers(projetoId: string, exceptId: string): Promise<void> {
    const { error } = await this.client
      .from('iteracoes')
      .update({ status: 'planejada' })
      .eq('projeto_id', projetoId)
      .neq('id', exceptId)
    if (error) throw error
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IArtefatoRepository } from './IArtefatoRepository'
import type { Artefato, ApprovalStatus, ViewPreference, CreateArtefatoInput } from '../model/types'

export class SupabaseArtefatoRepository implements IArtefatoRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Artefato> {
    const { data, error } = await this.client
      .from('artefatos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Artefato
  }

  async findByIteracao(iteracaoId: string, atividadeId?: string): Promise<Artefato[]> {
    let query = this.client
      .from('artefatos')
      .select('*')
      .eq('iteracao_id', iteracaoId)
      .order('versao', { ascending: false })
    if (atividadeId) {
      query = query.eq('atividade_id', atividadeId)
    }
    const { data, error } = await query
    if (error) throw error
    return data as Artefato[]
  }

  async findCurrentVersion(iteracaoId: string, atividadeId: string, nome: string): Promise<number> {
    const { data } = await this.client
      .from('artefatos')
      .select('versao')
      .eq('iteracao_id', iteracaoId)
      .eq('atividade_id', atividadeId)
      .eq('nome', nome)
      .order('versao', { ascending: false })
      .limit(1)
    return data && data.length > 0 ? data[0].versao : 0
  }

  async create(input: CreateArtefatoInput): Promise<Artefato> {
    const { data, error } = await this.client
      .from('artefatos')
      .insert({
        ...input,
        tipo: input.tipo ?? 'texto',
        preferencia_view: input.preferencia_view ?? 'visual',
      })
      .select()
      .single()
    if (error) throw error
    return data as Artefato
  }

  async updateStatus(artefatoId: string, status: ApprovalStatus): Promise<Artefato> {
    const { data, error } = await this.client
      .from('artefatos')
      .update({ status_aprovacao: status })
      .eq('id', artefatoId)
      .select()
      .single()
    if (error) throw error
    return data as Artefato
  }

  async updateContent(artefatoId: string, conteudoJson: Record<string, unknown>): Promise<Artefato> {
    const { data, error } = await this.client
      .from('artefatos')
      .update({ conteudo_json: conteudoJson })
      .eq('id', artefatoId)
      .select()
      .single()
    if (error) throw error
    return data as Artefato
  }

  async updateViewPreference(artefatoId: string, preference: ViewPreference): Promise<Artefato> {
    const { data, error } = await this.client
      .from('artefatos')
      .update({ preferencia_view: preference })
      .eq('id', artefatoId)
      .select()
      .single()
    if (error) throw error
    return data as Artefato
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IDocumentoRepository } from './IDocumentoRepository'
import type { Documento, CreateDocumentoInput } from '../model/types'

export class SupabaseDocumentoRepository implements IDocumentoRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByProjeto(projectId: string): Promise<Documento[]> {
    const { data, error } = await this.client
      .from('documentos_projeto')
      .select('*')
      .eq('projeto_id', projectId)
      .order('ordem')
      .order('criado_em')
    if (error) throw error
    return data as Documento[]
  }

  async findActiveByProjeto(projectId: string): Promise<{ titulo: string; conteudo_md: string }[]> {
    const { data, error } = await this.client
      .from('documentos_projeto')
      .select('titulo, conteudo_md')
      .eq('projeto_id', projectId)
      .eq('ativo', true)
      .order('ordem')
    if (error) throw error
    return data as { titulo: string; conteudo_md: string }[]
  }

  async create(projectId: string, payload: CreateDocumentoInput, empresaId: string): Promise<Documento> {
    const { data, error } = await this.client
      .from('documentos_projeto')
      .insert({ ...payload, projeto_id: projectId, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    return data as Documento
  }

  async update(id: string, payload: Partial<Omit<Documento, 'id' | 'criado_em' | 'atualizado_em'>>): Promise<Documento> {
    const { data, error } = await this.client
      .from('documentos_projeto')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Documento
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('documentos_projeto').delete().eq('id', id)
    if (error) throw error
  }
}

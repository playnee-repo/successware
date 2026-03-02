import type { Documento, CreateDocumentoInput } from '../model/types'

export interface IDocumentoRepository {
  findByProjeto(projectId: string): Promise<Documento[]>
  findActiveByProjeto(projectId: string): Promise<{ titulo: string; conteudo_md: string }[]>
  create(projectId: string, payload: CreateDocumentoInput, empresaId: string): Promise<Documento>
  update(id: string, payload: Partial<Omit<Documento, 'id' | 'criado_em' | 'atualizado_em'>>): Promise<Documento>
  delete(id: string): Promise<void>
}

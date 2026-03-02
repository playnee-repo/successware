import type { IDocumentoRepository } from '@/entities/document/api/IDocumentoRepository'
import type { Documento, CreateDocumentoInput } from '@/entities/document/model/types'

export class DocumentoService {
  constructor(private readonly repo: IDocumentoRepository) {}

  findByProjeto(projectId: string): Promise<Documento[]> {
    return this.repo.findByProjeto(projectId)
  }

  create(projectId: string, payload: CreateDocumentoInput, empresaId: string): Promise<Documento> {
    return this.repo.create(projectId, payload, empresaId)
  }

  update(id: string, payload: Partial<Omit<Documento, 'id' | 'criado_em' | 'atualizado_em'>>): Promise<Documento> {
    return this.repo.update(id, payload)
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}

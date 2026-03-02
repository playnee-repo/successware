import type { Artefato, ApprovalStatus, ViewPreference, CreateArtefatoInput } from '../model/types'

export interface IArtefatoRepository {
  findById(id: string): Promise<Artefato>
  findByIteracao(iteracaoId: string, atividadeId?: string): Promise<Artefato[]>
  findCurrentVersion(iteracaoId: string, atividadeId: string, nome: string): Promise<number>
  create(input: CreateArtefatoInput): Promise<Artefato>
  updateStatus(artefatoId: string, status: ApprovalStatus): Promise<Artefato>
  updateContent(artefatoId: string, conteudoJson: Record<string, unknown>): Promise<Artefato>
  updateViewPreference(artefatoId: string, preference: ViewPreference): Promise<Artefato>
}

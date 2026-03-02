import type { Atividade } from '../model/types'

export interface IAtividadeRepository {
  findAll(disciplina?: string): Promise<Atividade[]>
  findById(id: string): Promise<Atividade>
  findDistinctDisciplinas(): Promise<string[]>
  create(payload: Omit<Atividade, 'id' | 'criado_em'>): Promise<Atividade>
  update(id: string, payload: Partial<Omit<Atividade, 'id' | 'criado_em'>>): Promise<Atividade>
  delete(id: string): Promise<void>
  renameDisciplina(oldName: string, newName: string): Promise<void>
  updateAgente(oldId: string, newId: string): Promise<void>
}

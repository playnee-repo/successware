import type { Disciplina } from '../model/types'

export interface IDisciplinaRepository {
  findAll(): Promise<Disciplina[]>
  findById(id: string): Promise<Disciplina | null>
  create(data: Omit<Disciplina, 'ordem'> & { ordem?: number }): Promise<Disciplina>
  update(id: string, data: Partial<Omit<Disciplina, 'id'>>): Promise<Disciplina>
  delete(id: string): Promise<void>
}

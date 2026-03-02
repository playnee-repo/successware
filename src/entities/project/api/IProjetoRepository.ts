import type { Project, CreateProjectInput, DisciplinaProgresso } from '../model/types'

export interface IProjetoRepository {
  findAll(): Promise<Project[]>
  findById(id: string): Promise<Project>
  create(input: CreateProjectInput, empresaId: string): Promise<Project>
  delete(id: string): Promise<void>
  getProgress(projetoId: string): Promise<DisciplinaProgresso[]>
}

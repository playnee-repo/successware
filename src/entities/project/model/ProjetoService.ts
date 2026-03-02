import type { IProjetoRepository } from '../api/IProjetoRepository'
import type { Project, CreateProjectInput, DisciplinaProgresso } from './types'

export class ProjetoService {
  constructor(private readonly repo: IProjetoRepository) {}

  findAll(): Promise<Project[]> {
    return this.repo.findAll()
  }

  findById(id: string): Promise<Project> {
    return this.repo.findById(id)
  }

  create(input: CreateProjectInput, empresaId: string): Promise<Project> {
    return this.repo.create(input, empresaId)
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }

  getProgress(projetoId: string): Promise<DisciplinaProgresso[]> {
    return this.repo.getProgress(projetoId)
  }
}

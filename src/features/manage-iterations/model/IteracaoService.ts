import type { IIteracaoRepository } from '@/entities/iteration/api/IIteracaoRepository'
import type { Iteration, CreateIterationInput } from '@/entities/iteration/model/types'

export class IteracaoService {
  constructor(private readonly repo: IIteracaoRepository) {}

  findByProjeto(projetoId: string): Promise<Iteration[]> {
    return this.repo.findByProjeto(projetoId)
  }

  async create(input: CreateIterationInput, empresaId: string): Promise<Iteration> {
    const ordem = input.ordem ?? (await this.repo.findMaxOrdem(input.projeto_id)) + 1
    return this.repo.create(input, empresaId, ordem)
  }

  async activate(iteracaoId: string, projetoId: string): Promise<Iteration> {
    await this.repo.deactivateOthers(projetoId, iteracaoId)
    return this.repo.activate(iteracaoId)
  }
}

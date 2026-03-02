import type { Iteration, CreateIterationInput } from '../model/types'

export interface IIteracaoRepository {
  findByProjeto(projetoId: string): Promise<Iteration[]>
  findMaxOrdem(projetoId: string): Promise<number>
  create(input: CreateIterationInput, empresaId: string, ordem: number): Promise<Iteration>
  activate(iteracaoId: string): Promise<Iteration>
  deactivateOthers(projetoId: string, exceptId: string): Promise<void>
}

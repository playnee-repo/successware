import type { ConfiguracaoAtividade } from '../model/types'

export interface ConfiguracaoComAtividade extends ConfiguracaoAtividade {
  atividades: {
    id: string
    nome: string
    disciplina: string
    ordem: number
  }
}

export interface IConfiguracaoRepository {
  findByAtividade(atividadeId?: string): Promise<ConfiguracaoAtividade[]>
  findAllWithAtividade(): Promise<ConfiguracaoComAtividade[]>
  findByAtividadeWithAtividade(atividadeId: string): Promise<ConfiguracaoComAtividade[]>
  create(payload: Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>): Promise<ConfiguracaoAtividade>
  update(id: string, payload: Partial<Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>>): Promise<ConfiguracaoAtividade>
  delete(id: string): Promise<void>
  updateAgenteResponsavel(oldAgentId: string, newAgentId: string): Promise<void>
}

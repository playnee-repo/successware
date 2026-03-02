import type { IAtividadeRepository } from '@/entities/artifact/api/IAtividadeRepository'
import type { IConfiguracaoRepository, ConfiguracaoComAtividade } from '@/entities/artifact/api/IConfiguracaoRepository'
import type { IAgenteRepository } from '@/entities/agent/api/IAgenteRepository'
import type { Atividade, ConfiguracaoAtividade } from '@/entities/artifact/model/types'
import type { AgenteConfig } from '@/entities/admin/model/types'

export class AdminService {
  constructor(
    private readonly atividadeRepo: IAtividadeRepository,
    private readonly configuracaoRepo: IConfiguracaoRepository,
    private readonly agenteRepo: IAgenteRepository,
  ) {}

  // ── Atividades ──────────────────────────────────────────────────────────────

  getAllAtividades(): Promise<Atividade[]> {
    return this.atividadeRepo.findAll()
  }

  createAtividade(payload: Omit<Atividade, 'id' | 'criado_em'>): Promise<Atividade> {
    return this.atividadeRepo.create(payload)
  }

  updateAtividade(id: string, payload: Partial<Omit<Atividade, 'id' | 'criado_em'>>): Promise<Atividade> {
    return this.atividadeRepo.update(id, payload)
  }

  deleteAtividade(id: string): Promise<void> {
    return this.atividadeRepo.delete(id)
  }

  renameDisciplina(oldName: string, newName: string): Promise<void> {
    return this.atividadeRepo.renameDisciplina(oldName, newName)
  }

  // ── Configurações ───────────────────────────────────────────────────────────

  getAllConfiguracoes(): Promise<ConfiguracaoComAtividade[]> {
    return this.configuracaoRepo.findAllWithAtividade()
  }

  getConfiguracoesByAtividade(atividadeId: string): Promise<ConfiguracaoComAtividade[]> {
    return this.configuracaoRepo.findByAtividadeWithAtividade(atividadeId)
  }

  createConfiguracao(payload: Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>): Promise<ConfiguracaoAtividade> {
    return this.configuracaoRepo.create(payload)
  }

  updateConfiguracao(id: string, payload: Partial<Omit<ConfiguracaoAtividade, 'id' | 'criado_em'>>): Promise<ConfiguracaoAtividade> {
    return this.configuracaoRepo.update(id, payload)
  }

  deleteConfiguracao(id: string): Promise<void> {
    return this.configuracaoRepo.delete(id)
  }

  // ── Agentes ─────────────────────────────────────────────────────────────────

  getAllAgentes(): Promise<AgenteConfig[]> {
    return this.agenteRepo.findAll()
  }

  getAgente(id: string): Promise<AgenteConfig | null> {
    return this.agenteRepo.findById(id)
  }

  createAgente(payload: Omit<AgenteConfig, 'atualizado_em'>): Promise<AgenteConfig> {
    return this.agenteRepo.create(payload)
  }

  updateAgente(id: string, payload: Partial<AgenteConfig>): Promise<AgenteConfig> {
    return this.agenteRepo.update(id, payload)
  }

  deleteAgente(id: string): Promise<void> {
    return this.agenteRepo.delete(id)
  }

  async renameAgente(oldId: string, newId: string): Promise<void> {
    const agente = await this.agenteRepo.findById(oldId)
    if (!agente) throw new Error(`Agente ${oldId} não encontrado`)

    const { atualizado_em: _, ...rest } = agente as AgenteConfig & { atualizado_em: string | null }
    void _

    await this.agenteRepo.create({ ...rest, id: newId })
    await this.atividadeRepo.updateAgente(oldId, newId)
    await this.configuracaoRepo.updateAgenteResponsavel(oldId, newId)
    await this.agenteRepo.delete(oldId)
  }
}

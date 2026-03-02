import type { AgenteConfig } from '@/entities/admin/model/types'

export interface IAgenteRepository {
  findAll(): Promise<AgenteConfig[]>
  findById(id: string): Promise<AgenteConfig | null>
  create(payload: Omit<AgenteConfig, 'atualizado_em'>): Promise<AgenteConfig>
  update(id: string, payload: Partial<AgenteConfig>): Promise<AgenteConfig>
  delete(id: string): Promise<void>
}

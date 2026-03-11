import type { IConfiguracaoSistemaRepository } from '../api/IConfiguracaoSistemaRepository'

const CONFIG_DEFAULTS: Record<string, unknown> = {
  advisor_enabled: true,
  advisor_cooldown_minutes: 5,
}

export class ConfiguracaoSistemaService {
  constructor(private readonly repo: IConfiguracaoSistemaRepository) {}

  async fetchConfiguracoes<T extends Record<string, unknown>>(): Promise<T> {
    const rows = await this.repo.findAll()
    const mapa: Record<string, unknown> = {}
    for (const row of rows) {
      mapa[row.chave] = row.valor
    }
    return Object.fromEntries(
      Object.entries(CONFIG_DEFAULTS).map(([chave, defaultVal]) => [
        chave,
        chave in mapa ? mapa[chave] : defaultVal,
      ]),
    ) as T
  }

  set(chave: string, valor: unknown): Promise<void> {
    return this.repo.set(chave, valor)
  }
}

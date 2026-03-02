export interface IConfiguracaoSistemaRepository {
  findAll(): Promise<{ chave: string; valor: unknown }[]>
  set(chave: string, valor: unknown): Promise<void>
}

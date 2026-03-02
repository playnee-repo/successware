export interface Documento {
  id: string
  projeto_id: string
  titulo: string
  conteudo_md: string
  ordem: number
  ativo: boolean
  empresa_id: string | null
  criado_em: string
  atualizado_em: string
}

export interface CreateDocumentoInput {
  titulo: string
  conteudo_md: string
  ordem: number
  ativo?: boolean
}

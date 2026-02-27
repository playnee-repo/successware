export type AgenteConfig = {
  id: string
  nome: string
  descricao: string | null
  system_prompt: string
  chat_system_prompt: string | null
  modelo: string
  temperatura: number
  top_k: number | null
  top_p: number | null
  max_output_tokens: number | null
  ativo: boolean
  atualizado_em: string | null
}

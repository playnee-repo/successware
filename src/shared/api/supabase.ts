import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      projetos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          status: 'ativo' | 'pausado' | 'concluido' | 'arquivado'
          empresa: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['projetos']['Row'], 'id' | 'criado_em' | 'atualizado_em'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
        }
        Update: Partial<Database['public']['Tables']['projetos']['Insert']>
      }
      iteracoes: {
        Row: {
          id: string
          projeto_id: string
          nome: string
          modulo_foco: string | null
          status: 'planejada' | 'ativa' | 'concluida'
          ordem: number
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['iteracoes']['Row'], 'id' | 'criado_em' | 'atualizado_em'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
        }
        Update: Partial<Database['public']['Tables']['iteracoes']['Insert']>
      }
      atividades: {
        Row: {
          id: string
          disciplina: 'descoberta' | 'requisitos' | 'arquitetura' | 'construcao' | 'qualidade'
          nome: string
          descricao: string | null
          agente: string
          ordem: number
          icone: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['atividades']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['atividades']['Insert']>
      }
      definicoes_insumos: {
        Row: {
          id: string
          atividade_id: string
          tipo_insumo: string
          agente_responsavel: string
          schema_metadado_json: Record<string, unknown> | null
          prompt_template: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['definicoes_insumos']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['definicoes_insumos']['Insert']>
      }
      insumos_projeto: {
        Row: {
          id: string
          iteracao_id: string
          atividade_id: string
          definicao_id: string
          conteudo_json: Record<string, unknown>
          versao: number
          agente_autor: string
          status_aprovacao: 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado'
          preferencia_view: 'visual' | 'rawjson'
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['insumos_projeto']['Row'], 'id' | 'criado_em' | 'atualizado_em'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
        }
        Update: Partial<Database['public']['Tables']['insumos_projeto']['Insert']>
      }
      mensagens_agente: {
        Row: {
          id: string
          iteracao_id: string
          disciplina: string
          agente: string
          tipo: 'user' | 'agent' | 'system' | 'action'
          conteudo: string
          metadados_json: Record<string, unknown> | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['mensagens_agente']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['mensagens_agente']['Insert']>
      }
      documentos_projeto: {
        Row: {
          id: string
          projeto_id: string
          titulo: string
          conteudo_md: string
          ordem: number
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['documentos_projeto']['Row'], 'id' | 'criado_em' | 'atualizado_em'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
        }
        Update: Partial<Database['public']['Tables']['documentos_projeto']['Insert']>
      }
      agentes_config: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['agentes_config']['Row'], 'atualizado_em'> & {
          atualizado_em?: string
        }
        Update: Partial<Database['public']['Tables']['agentes_config']['Insert']>
      }
    }
  }
}

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
      empresas: {
        Row: {
          id: string
          nome: string
          slug: string
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>
      }
      membros_empresa: {
        Row: {
          id: string
          empresa_id: string
          user_id: string
          role: 'admin' | 'membro'
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['membros_empresa']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['membros_empresa']['Insert']>
      }
      projetos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          status: 'ativo' | 'pausado' | 'concluido' | 'arquivado'
          empresa: string | null
          empresa_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['projetos']['Row'], 'id' | 'criado_em' | 'atualizado_em' | 'empresa_id'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
          empresa_id?: string | null
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
          empresa_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['iteracoes']['Row'], 'id' | 'criado_em' | 'atualizado_em' | 'empresa_id'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
          empresa_id?: string | null
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
      configuracoes_atividade: {
        Row: {
          id: string
          atividade_id: string
          nome: string
          tipo_insumo: string
          agente_responsavel: string
          prompt_template: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['configuracoes_atividade']['Row'], 'id' | 'criado_em'> & {
          id?: string
          criado_em?: string
        }
        Update: Partial<Database['public']['Tables']['configuracoes_atividade']['Insert']>
      }
      artefatos: {
        Row: {
          id: string
          iteracao_id: string
          atividade_id: string
          configuracao_id: string | null
          nome: string
          tipo: 'texto' | 'link' | 'documento'
          conteudo_json: Record<string, unknown>
          versao: number
          agente_autor: string
          status_aprovacao: 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado'
          preferencia_view: 'visual' | 'rawjson'
          empresa_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['artefatos']['Row'], 'id' | 'criado_em' | 'atualizado_em' | 'empresa_id'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
          empresa_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['artefatos']['Insert']>
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
          empresa_id: string | null
          criado_em: string
        }
        Insert: Omit<Database['public']['Tables']['mensagens_agente']['Row'], 'id' | 'criado_em' | 'empresa_id'> & {
          id?: string
          criado_em?: string
          empresa_id?: string | null
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
          empresa_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: Omit<Database['public']['Tables']['documentos_projeto']['Row'], 'id' | 'criado_em' | 'atualizado_em' | 'empresa_id'> & {
          id?: string
          criado_em?: string
          atualizado_em?: string
          empresa_id?: string | null
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

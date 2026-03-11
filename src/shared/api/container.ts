import { supabase } from './supabase'
import type { IAiProvider } from './IAiProvider'

// ── AI Provider ─────────────────────────────────────────────────────────────
async function createAiProvider(): Promise<IAiProvider> {
  const provider = (import.meta.env.VITE_AI_PROVIDER as string)?.toLowerCase()

  if (provider === 'gemini') {
    const { GeminiAiProvider } = await import('./GeminiAiProvider') as { GeminiAiProvider: new (key: string) => IAiProvider }
    const key = import.meta.env.VITE_GEMINI_API_KEY as string
    if (!key) console.warn('[AI] VITE_GEMINI_API_KEY não configurada no .env.local')
    return new GeminiAiProvider(key || '')
  }

  // default: openai
  const { OpenAiProvider } = await import('./OpenAiProvider') as { OpenAiProvider: new (key: string) => IAiProvider }
  const key = import.meta.env.VITE_OPENAI_API_KEY as string
  if (!key) console.warn('[AI] VITE_OPENAI_API_KEY não configurada no .env.local')
  return new OpenAiProvider(key || '')
}

// Lazy singleton — resolved on first access
let _aiProvider: IAiProvider | null = null
export async function getAiProvider(): Promise<IAiProvider> {
  if (!_aiProvider) _aiProvider = await createAiProvider()
  return _aiProvider
}

// ── Repositories ────────────────────────────────────────────────────────────
import { SupabaseProjetoRepository } from '@/entities/project/api/SupabaseProjetoRepository'
import { SupabaseIteracaoRepository } from '@/entities/iteration/api/SupabaseIteracaoRepository'
import { SupabaseArtefatoRepository } from '@/entities/artifact/api/SupabaseArtefatoRepository'
import { SupabaseAtividadeRepository } from '@/entities/artifact/api/SupabaseAtividadeRepository'
import { SupabaseConfiguracaoRepository } from '@/entities/artifact/api/SupabaseConfiguracaoRepository'
import { SupabaseAgenteRepository } from '@/entities/agent/api/SupabaseAgenteRepository'
import { SupabaseMensagemRepository } from '@/entities/agent/api/SupabaseMensagemRepository'
import { SupabaseDocumentoRepository } from '@/entities/document/api/SupabaseDocumentoRepository'
import { SupabaseConfiguracaoSistemaRepository } from '@/entities/config/api/SupabaseConfiguracaoSistemaRepository'
import { SupabaseMembroRepository } from '@/entities/member/api/SupabaseMembroRepository'

// ── Services ────────────────────────────────────────────────────────────────
import { ProjetoService } from '@/entities/project/model/ProjetoService'
import { IteracaoService } from '@/features/manage-iterations/model/IteracaoService'
import { ArtefatoService } from '@/features/manage-artifacts/model/ArtefatoService'
import { AdminService } from '@/features/manage-admin/model/AdminService'
import { ExecuteAiService } from '@/features/execute-ai/model/ExecuteAiService'
import { DocumentoService } from '@/features/manage-documents/model/DocumentoService'
import { ConfiguracaoSistemaService } from '@/entities/config/model/ConfiguracaoSistemaService'
import { MembroService } from '@/entities/member/model/MembroService'
import { OnboardingService } from '@/features/onboarding/model/OnboardingService'

// ── Repository singletons ────────────────────────────────────────────────────
export const projetoRepo             = new SupabaseProjetoRepository(supabase)
export const iteracaoRepo            = new SupabaseIteracaoRepository(supabase)
export const artefatoRepo            = new SupabaseArtefatoRepository(supabase)
export const atividadeRepo           = new SupabaseAtividadeRepository(supabase)
export const configuracaoRepo        = new SupabaseConfiguracaoRepository(supabase)
export const agenteRepo              = new SupabaseAgenteRepository(supabase)
export const mensagemRepo            = new SupabaseMensagemRepository(supabase)
export const documentoRepo           = new SupabaseDocumentoRepository(supabase)
export const configuracaoSistemaRepo = new SupabaseConfiguracaoSistemaRepository(supabase)
export const membroRepo              = new SupabaseMembroRepository(supabase)

// ── Service singletons ───────────────────────────────────────────────────────
export const projetoService             = new ProjetoService(projetoRepo)
export const iteracaoService            = new IteracaoService(iteracaoRepo)
export const artefatoService            = new ArtefatoService(artefatoRepo, atividadeRepo, configuracaoRepo)
export const adminService               = new AdminService(atividadeRepo, configuracaoRepo, agenteRepo)
export const executeAiService           = new ExecuteAiService(artefatoRepo, documentoRepo, agenteRepo)
export const documentoService           = new DocumentoService(documentoRepo)
export const configuracaoSistemaService = new ConfiguracaoSistemaService(configuracaoSistemaRepo)
export const membroService              = new MembroService(membroRepo)
export const onboardingService          = new OnboardingService(projetoRepo, iteracaoRepo)

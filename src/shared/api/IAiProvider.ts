import type { AgenteConfig } from '@/entities/admin/model/types'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

const PROVIDER = (import.meta.env.VITE_AI_PROVIDER as string)?.toLowerCase() ?? 'openai'
const DEFAULT_OPENAI = 'gpt-4o'
const DEFAULT_GEMINI = 'gemini-2.5-flash'

/** Resolve o modelo efetivo, ignorando modelos incompatíveis com o provider ativo. */
export function resolveModel(modelo?: string | null): string {
  if (PROVIDER === 'gemini') {
    return modelo?.startsWith('gemini') ? modelo : DEFAULT_GEMINI
  }
  return modelo?.startsWith('gpt') || modelo?.startsWith('o') ? modelo : DEFAULT_OPENAI
}

/** Default model para o provider ativo. */
export const DEFAULT_MODEL = PROVIDER === 'gemini' ? DEFAULT_GEMINI : DEFAULT_OPENAI

/** Modelos disponíveis para o provider ativo. */
export const AVAILABLE_MODELS: { value: string; label: string }[] =
  PROVIDER === 'gemini'
    ? [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      ]
    : [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4.1', label: 'GPT-4.1' },
        { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
        { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
        { value: 'o3-mini', label: 'o3 Mini' },
      ]

/**
 * Abstração agnóstica de provedor de IA.
 * Duas operações cobrem todos os casos de uso do app.
 */
export interface IAiProvider {
  /** Geração one-shot (sem histórico). */
  generateContent(
    prompt: string,
    config?: AgenteConfig | null,
  ): Promise<string>

  /** Chat com system prompt + histórico. */
  chatComplete(
    systemPrompt: string,
    history: AiMessage[],
    userMessage: string,
    config?: AgenteConfig | null,
  ): Promise<string>
}

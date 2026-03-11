import OpenAI from 'openai'
import type { AgenteConfig } from '@/entities/admin/model/types'
import { resolveModel, type IAiProvider, type AiMessage } from './IAiProvider'

export class OpenAiProvider implements IAiProvider {
  private readonly client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
  }

  private getModel(config?: AgenteConfig | null): string {
    return resolveModel(config?.modelo)
  }

  private getParams(config?: AgenteConfig | null) {
    return {
      temperature: config?.temperatura ?? 0.7,
      top_p: config?.top_p ?? 0.95,
      max_tokens: config?.max_output_tokens ?? 8192,
    }
  }

  async generateContent(
    prompt: string,
    config?: AgenteConfig | null,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.getModel(config),
      messages: [{ role: 'user', content: prompt }],
      ...this.getParams(config),
    })
    return response.choices[0]?.message?.content?.trim() ?? ''
  }

  async chatComplete(
    systemPrompt: string,
    history: AiMessage[],
    userMessage: string,
    config?: AgenteConfig | null,
  ): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content })
    }

    messages.push({ role: 'user', content: userMessage })

    const response = await this.client.chat.completions.create({
      model: this.getModel(config),
      messages,
      ...this.getParams(config),
    })
    return response.choices[0]?.message?.content?.trim() ?? ''
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AgenteConfig } from '@/entities/admin/model/types'
import { resolveModel, type IAiProvider, type AiMessage } from './IAiProvider'

export class GeminiAiProvider implements IAiProvider {
  private readonly genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || 'placeholder')
  }

  private getModel(config?: AgenteConfig | null) {
    return this.genAI.getGenerativeModel({
      model: resolveModel(config?.modelo),
      generationConfig: {
        temperature: config?.temperatura ?? 0.7,
        topK: config?.top_k ?? 40,
        topP: config?.top_p ?? 0.95,
        maxOutputTokens: config?.max_output_tokens ?? 8192,
      },
    })
  }

  async generateContent(
    prompt: string,
    config?: AgenteConfig | null,
  ): Promise<string> {
    const model = this.getModel(config)
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }

  async chatComplete(
    systemPrompt: string,
    history: AiMessage[],
    userMessage: string,
    config?: AgenteConfig | null,
  ): Promise<string> {
    const model = this.getModel(config)

    const geminiHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido.' }] },
    ]

    for (const msg of history) {
      geminiHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }

    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(userMessage)
    return result.response.text().trim()
  }
}

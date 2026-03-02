import { getGeminiModel } from '@/shared/config/gemini'
import type { IProjetoRepository } from '@/entities/project/api/IProjetoRepository'
import type { IIteracaoRepository } from '@/entities/iteration/api/IIteracaoRepository'
import type { Project, ProjectTipo } from '@/entities/project/model/types'

interface IdeiaEstruturada {
  nome: string
  descricao: string
  contexto_ia: string
  iteracao_nome: string
}

async function estruturarIdeia(ideia: string, tipo: ProjectTipo): Promise<IdeiaEstruturada> {
  const model = getGeminiModel()

  const prompt = `Você recebeu uma ideia de projeto de software descrita livremente por um usuário.
Seu trabalho é estruturá-la como um projeto profissional, de forma clara e objetiva.

Ideia do usuário: "${ideia}"
Tipo de projeto: ${tipo}

Responda APENAS com JSON válido (sem markdown, sem explicações), neste formato exato:
{
  "nome": "nome curto do projeto (máx 5 palavras, sem artigos desnecessários)",
  "descricao": "descrição em 1-2 frases, clara e direta, sem jargão técnico",
  "contexto_ia": "resumo técnico para uso interno da IA: tipo do produto, problema que resolve, público-alvo e principais funcionalidades esperadas",
  "iteracao_nome": "nome da primeira iteração (ex: MVP, Sprint 1, Fase 1)"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as IdeiaEstruturada
}

export class OnboardingService {
  constructor(
    private readonly projetoRepo: IProjetoRepository,
    private readonly iteracaoRepo: IIteracaoRepository,
  ) {}

  async createFromIdeia(ideia: string, tipo: ProjectTipo, empresaId: string): Promise<Project> {
    const estruturada = await estruturarIdeia(ideia, tipo)

    const projeto = await this.projetoRepo.create(
      { nome: estruturada.nome, descricao: estruturada.descricao, tipo, contexto_ia: estruturada.contexto_ia },
      empresaId,
    )

    await this.iteracaoRepo.create(
      { projeto_id: projeto.id, nome: estruturada.iteracao_nome, status: 'ativa' },
      empresaId,
      1,
    )

    return projeto
  }
}

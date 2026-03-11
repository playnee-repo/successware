import { useState, useEffect, useRef } from 'react'
import { getAiProvider } from '@/shared/api/container'
import type { Project } from '@/entities/project/model/types'
import type { DisciplinaProgresso } from '@/entities/project/model/useProjectProgress'

export interface AdvisorRecomendacao {
  titulo: string
  mensagem: string
  acao: string
  disciplina: string | null
}

const SYSTEM_PROMPT = `Você é o ADVISOR, um copiloto de engenharia de software.
Analise o estado atual do projeto e forneça UMA recomendação concisa e acionável.
Tom: parceiro experiente, direto, sem jargão, sem formalidade. Em português.

Responda APENAS com JSON válido (sem markdown, sem explicação):
{
  "titulo": "título curto (máx 5 palavras)",
  "mensagem": "observação clara + impacto em 1-2 frases",
  "acao": "texto do botão (máx 4 palavras)",
  "disciplina": "descoberta|requisitos|arquitetura|construcao|qualidade ou null"
}`

async function analisarProjeto(
  projeto: Project,
  disciplinasProgresso: DisciplinaProgresso[],
  disciplinaAtual: string,
): Promise<AdvisorRecomendacao> {
  const aiProvider = await getAiProvider()

  const progressoTexto = disciplinasProgresso.length
    ? disciplinasProgresso
        .map(d => `  ${d.disciplina}: ${d.aprovados}/${d.total_artefatos} aprovados (${d.progresso}%)`)
        .join('\n')
    : '  Nenhum artefato criado ainda.'

  const prompt = `${SYSTEM_PROMPT}

---

Projeto: "${projeto.nome}"
Tipo: ${projeto.tipo ?? 'não definido'}
Contexto: ${projeto.contexto_ia ?? projeto.descricao ?? 'sem contexto'}
Disciplina atual: ${disciplinaAtual}

Progresso por disciplina:
${progressoTexto}

Identifique o gap mais crítico e recomende a próxima ação de maior impacto.`

  const text = await aiProvider.generateContent(prompt)
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean) as AdvisorRecomendacao
}

export function useAdvisor(
  projeto: Project | null | undefined,
  disciplinasProgresso: DisciplinaProgresso[],
  disciplinaAtual: string,
  cooldownMinutes = 5,
) {
  const [recomendacao, setRecomendacao] = useState<AdvisorRecomendacao | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastCallRef = useRef<number>(0)
  const lastKeyRef = useRef<string>('')

  // Chave estável: só muda quando o progresso real muda (evita refetch/ruído)
  const progressKey = disciplinasProgresso
    .map(d => `${d.disciplina}:${Math.round(d.progresso)}`)
    .join(',')

  const analisar = async () => {
    if (!projeto) return
    setIsLoading(true)
    setError(null)
    try {
      const rec = await analisarProjeto(projeto, disciplinasProgresso, disciplinaAtual)
      setRecomendacao(rec)
      lastCallRef.current = Date.now()
      lastKeyRef.current = progressKey
    } catch {
      setError('Não foi possível analisar agora.')
    } finally {
      setIsLoading(false)
    }
  }

  // Dispara só na primeira carga ou quando o progresso mudar; throttle 5 min (evita token em toda navegação)
  useEffect(() => {
    if (!projeto) return
    const now = Date.now()
    const timeSince = now - lastCallRef.current
    const progressChanged = progressKey !== '' && progressKey !== lastKeyRef.current
    const isFirstCall = lastCallRef.current === 0
    const COOLDOWN_MS = Math.max(1, Math.min(60, cooldownMinutes)) * 60 * 1000
    const cooldownOk = timeSince > COOLDOWN_MS

    if (isFirstCall || (progressChanged && cooldownOk)) {
      analisar()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto?.id, progressKey])

  return { recomendacao, isLoading, error, analisar }
}

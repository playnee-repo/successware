import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, RefreshCw, ArrowRight, Loader2, Lightbulb } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useAdvisor } from '@/features/advisor/model/useAdvisor'
import { useProjectProgress } from '@/entities/project/model/useProjectProgress'
import type { Project } from '@/entities/project/model/types'

const EXPANDED_KEY = 'advisor-expanded'
const VALID_DISCIPLINAS = ['descoberta', 'requisitos', 'arquitetura', 'construcao', 'qualidade']

function normalizarDisciplina(raw: string | null): string | null {
  if (!raw) return null
  const lower = raw.toLowerCase().trim()
  return VALID_DISCIPLINAS.includes(lower) ? lower : null
}

interface AdvisorWidgetProps {
  projeto: Project
  disciplinaAtual: string
}

export function AdvisorWidget({ projeto, disciplinaAtual }: AdvisorWidgetProps) {
  const { data: disciplinasProgresso = [] } = useProjectProgress(projeto.id)
  const { recomendacao, isLoading, error, analisar } = useAdvisor(
    projeto,
    disciplinasProgresso,
    disciplinaAtual,
  )

  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(EXPANDED_KEY) !== 'false' } catch { return true }
  })

  const prevRecRef = useRef(recomendacao)
  useEffect(() => {
    if (recomendacao && recomendacao !== prevRecRef.current) {
      prevRecRef.current = recomendacao
      setExpanded(true)
    }
  }, [recomendacao])

  function toggle() {
    setExpanded(v => {
      const next = !v
      try { localStorage.setItem(EXPANDED_KEY, String(next)) } catch {}
      return next
    })
  }

  const disciplinaDestino = recomendacao ? normalizarDisciplina(recomendacao.disciplina) : null
  const actionHref = disciplinaDestino
    ? `/project/${projeto.id}/${disciplinaDestino}`
    : null

  return (
    <div className="absolute bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Card expandido */}
      {expanded && (
        <div className="w-72 bg-card border border-border rounded-2xl shadow-2xl shadow-black/25 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60">
            <div className="w-5 h-5 rounded-md gradient-primary flex items-center justify-center shrink-0">
              <Lightbulb className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-bold text-foreground flex-1 tracking-wide uppercase">
              ADVISOR
            </span>
            <button
              type="button"
              onClick={analisar}
              disabled={isLoading}
              title="Analisar novamente"
              className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40"
            >
              <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="px-4 py-4 min-h-[80px]">
            {isLoading && !recomendacao ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="text-xs">Analisando projeto...</span>
              </div>
            ) : error ? (
              <p className="text-xs text-muted-foreground">{error}</p>
            ) : recomendacao ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {recomendacao.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {recomendacao.mensagem}
                  </p>
                </div>
                {actionHref && (
                  <Link
                    to={actionHref}
                    className={cn(
                      'flex items-center justify-center gap-1.5 w-full h-7 rounded-md text-xs font-medium',
                      'gradient-primary text-white hover:opacity-90 transition-opacity',
                    )}
                  >
                    {recomendacao.acao}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Botão toggle */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold',
          'gradient-primary text-white shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity',
        )}
      >
        <div className={cn(
          'w-1.5 h-1.5 rounded-full bg-white/80',
          isLoading && 'animate-pulse',
          !isLoading && recomendacao && 'bg-white',
        )} />
        ADVISOR
      </button>
    </div>
  )
}

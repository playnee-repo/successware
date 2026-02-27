import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronDown, ChevronUp, Loader2, FileText, CheckCircle2, Eye } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ArtifactEditor } from '@/widgets/artifact-editor/ui/ArtifactEditor'
import { useExecuteAi } from '@/features/execute-ai/model/useExecuteAi'
import { supabase } from '@/shared/api/supabase'
import { cn } from '@/shared/lib/utils'
import type { AtividadeComProgresso, InsumoProject } from '@/entities/artifact/model/types'
import type { Project } from '@/entities/project/model/types'
import type { Iteration } from '@/entities/iteration/model/types'

interface ActivityCardProps {
  atividade: AtividadeComProgresso
  projeto: Project
  iteracao: Iteration
}

const AGENT_ACCENT: Record<string, string> = {
  SCRIBE: 'card-accent-indigo',
  ARCH: 'card-accent-blue',
  FORGE: 'card-accent-orange',
  GUARDIAN: 'card-accent-emerald',
}

const AGENT_BADGE: Record<string, string> = {
  SCRIBE: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  ARCH: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  FORGE: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  GUARDIAN: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
}

function ActivityCard({ atividade, projeto, iteracao }: ActivityCardProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<InsumoProject | null>(null)
  const { execute, isExecuting } = useExecuteAi()
  const queryClient = useQueryClient()

  // Merge insumo recém-gerado com os vindos da query (evita depender do refetch para exibir)
  const allInsumos: InsumoProject[] = selectedInsumo && !atividade.insumos.find(i => i.id === selectedInsumo.id)
    ? [selectedInsumo, ...atividade.insumos]
    : atividade.insumos

  const latestInsumo = allInsumos[0] ?? null
  const hasContent = !!latestInsumo || !!selectedInsumo

  const agente = atividade.agente || 'SCRIBE'
  const accentClass = AGENT_ACCENT[agente] ?? 'card-accent-indigo'
  const agentBadgeClass = AGENT_BADGE[agente] ?? AGENT_BADGE.SCRIBE

  const handleExecute = async () => {
    if (!atividade.definicoes.length) return

    const definicao = atividade.definicoes[0]
    const insumosAprovados = atividade.insumos.filter(i => i.status_aprovacao === 'aprovado')

    try {
      const result = await execute({ projeto, iteracao, atividade, definicao, insumosAprovados })

      await supabase.from('mensagens_agente').insert({
        iteracao_id: iteracao.id,
        disciplina: atividade.disciplina,
        agente: 'SCRIBE',
        tipo: 'agent',
        conteudo: result.chatMessage,
        metadados_json: { atividade_id: atividade.id, insumo_id: result.insumo.id, versao: result.insumo.versao },
      })

      queryClient.invalidateQueries({ queryKey: ['mensagens', iteracao.id] })

      navigate(`/project/${projeto.id}/${atividade.disciplina}/resultado/${result.insumo.id}`)
    } catch (err) {
      console.error('Execute AI error:', err)
    }
  }

  const progressColor =
    atividade.progresso === 100
      ? 'text-emerald-400'
      : atividade.progresso >= 50
      ? 'text-amber-400'
      : 'text-muted-foreground'

  const progressBarColor =
    atividade.progresso === 100
      ? 'bg-emerald-500'
      : atividade.progresso >= 50
      ? 'bg-amber-500'
      : 'bg-primary'

  return (
    <div className={cn(
      'bg-card border border-border rounded-lg overflow-hidden card-hover',
      'ring-1 ring-inset ring-black/5',
      accentClass,
      atividade.progresso === 100 && 'border-l-emerald-500'
    )}>
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + title + desc */}
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ring-inset-subtle',
              agentBadgeClass
            )}>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  {atividade.nome}
                </h3>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider',
                  agentBadgeClass
                )}>
                  {agente}
                </span>
                {latestInsumo && (
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                    v{latestInsumo.versao}
                  </span>
                )}
              </div>
              {atividade.descricao && (
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2 font-normal">
                  {atividade.descricao}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress row */}
        {atividade.total_insumos > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/70">
                {atividade.insumos_aprovados}/{atividade.total_insumos} aprovados
              </span>
              <span className={cn('text-[10px] font-bold', progressColor)}>
                {atividade.progresso}%
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progressBarColor)}
                style={{ width: `${atividade.progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between mt-3">
          {/* Left: status badge */}
          <div>
            {latestInsumo && (
              <Badge
                variant={latestInsumo.status_aprovacao === 'aprovado' ? 'success' : 'outline'}
                className={cn(
                  'text-[9px] h-5',
                  latestInsumo.status_aprovacao !== 'aprovado' && 'text-muted-foreground border-border'
                )}
              >
                {latestInsumo.status_aprovacao === 'aprovado' ? (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    Aprovado
                  </>
                ) : (
                  latestInsumo.status_aprovacao === 'rascunho' ? 'Rascunho' :
                  latestInsumo.status_aprovacao === 'em_revisao' ? 'Em Revisão' : 'Rejeitado'
                )}
              </Badge>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1.5">
            {hasContent && (selectedInsumo ?? latestInsumo) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const insumo = selectedInsumo ?? latestInsumo!
                  navigate(
                    `/project/${projeto.id}/${atividade.disciplina}/resultado/${insumo.id}`
                  )
                }}
                className="h-7 px-2.5 text-[11px] gap-1.5 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Eye className="w-3 h-3" />
                Ver resultado
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting || !atividade.definicoes.length}
              title={
                isExecuting
                  ? 'Gerando conteúdo...'
                  : !atividade.definicoes.length
                    ? 'Desabilitado: esta atividade não tem definição de insumo. Configure em Admin → Definições de insumo.'
                    : 'Gerar conteúdo com IA usando a definição de insumo desta atividade'
              }
              className={cn(
                'h-7 px-2.5 text-[11px] gap-1.5 font-medium',
                'gradient-primary border-0 text-white',
                'hover:opacity-90 disabled:opacity-40',
                'shadow-lg shadow-primary/20'
              )}
            >
              {isExecuting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Sparkles className="w-3 h-3" />
              }
              {isExecuting ? 'Gerando...' : 'Executar IA'}
            </Button>
          </div>
        </div>
      </div>

      {/* Expand section */}
      {hasContent && (
        <div className={cn(
          'border-t border-border/60',
          !expanded && 'bg-card/40'
        )}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-left px-4 py-2"
          >
            <FileText className="w-3 h-3" />
            <span className="font-medium">{allInsumos.length} versão(ões) disponível(is)</span>
            {expanded
              ? <ChevronUp className="w-3 h-3 ml-auto" />
              : <ChevronDown className="w-3 h-3 ml-auto" />
            }
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              {/* Version pills */}
              <div className="flex gap-1.5 flex-wrap">
                {allInsumos.map((insumo) => (
                  <button
                    key={insumo.id}
                    onClick={() => setSelectedInsumo(insumo)}
                    className={cn(
                      'text-[10px] font-mono px-2 py-1 rounded-md border transition-all duration-150',
                      selectedInsumo?.id === insumo.id
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground bg-muted/50'
                    )}
                  >
                    v{insumo.versao}
                    <span className="ml-1 opacity-60">•</span>
                    <span className="ml-1">{insumo.status_aprovacao}</span>
                  </button>
                ))}
              </div>

              {/* Editor */}
              {selectedInsumo && (
                <div className="h-80">
                  <ArtifactEditor
                    insumo={selectedInsumo}
                    onClose={() => setSelectedInsumo(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ActivityGridProps {
  atividades: AtividadeComProgresso[]
  projeto: Project
  iteracao: Iteration
  isLoading?: boolean
}

export function ActivityGrid({ atividades, projeto, iteracao, isLoading }: ActivityGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-36 rounded-lg bg-card border border-border animate-pulse card-accent-indigo"
          />
        ))}
      </div>
    )
  }

  if (!atividades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center ring-inset-subtle">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade configurada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Esta disciplina ainda não possui atividades definidas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {atividades.map(atividade => (
        <ActivityCard
          key={atividade.id}
          atividade={atividade}
          projeto={projeto}
          iteracao={iteracao}
        />
      ))}
    </div>
  )
}

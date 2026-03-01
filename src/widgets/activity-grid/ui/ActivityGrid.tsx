import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronDown, ChevronUp, Loader2, FileText, ExternalLink, Paperclip, CheckCircle2, Eye, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useExecuteAi } from '@/features/execute-ai/model/useExecuteAi'
import { useCreateArtefato } from '@/features/manage-artifacts/model/useArtifacts'
import { supabase } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth'
import { cn } from '@/shared/lib/utils'
import { NomeArtefatoDialog } from './NomeArtefatoDialog'
import type { AtividadeComProgresso, Artefato, ArtefatoTipo, ConfiguracaoAtividade } from '@/entities/artifact/model/types'
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

/** Agrupa artefatos por nome, retornando {nome, latest, versoes}[] ordenados por nome */
function groupArtefatosByNome(artefatos: Artefato[]) {
  const byNome = new Map<string, Artefato[]>()
  for (const a of artefatos) {
    if (!byNome.has(a.nome)) byNome.set(a.nome, [])
    byNome.get(a.nome)!.push(a)
  }
  // artefatos já vêm ordenados desc por versão da query
  return Array.from(byNome.entries()).map(([nome, versoes]) => ({
    nome,
    latest: versoes[0],
    versoes,
  }))
}

function ArtefatoTypeIcon({ tipo }: { tipo: ArtefatoTipo }) {
  if (tipo === 'link') return <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
  if (tipo === 'documento') return <Paperclip className="w-3.5 h-3.5 text-muted-foreground/50" />
  return <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
}

function ActivityCard({ atividade, projeto, iteracao }: ActivityCardProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { execute, isExecuting } = useExecuteAi()
  const { mutateAsync: createArtefato } = useCreateArtefato()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const agente = atividade.agente || 'SCRIBE'
  const accentClass = AGENT_ACCENT[agente] ?? 'card-accent-indigo'
  const agentBadgeClass = AGENT_BADGE[agente] ?? AGENT_BADGE.SCRIBE

  const artefatosAgrupados = groupArtefatosByNome(atividade.artefatos)
  const hasContent = artefatosAgrupados.length > 0

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

  const handleExecuteNovo = async (params: { nome: string; tipo: ArtefatoTipo; configuracao?: ConfiguracaoAtividade; conteudo?: Record<string, unknown> }) => {
    if (params.tipo === 'link') {
      try {
        await createArtefato({
          iteracao_id: iteracao.id,
          atividade_id: atividade.id,
          configuracao_id: atividade.configuracoes[0]?.id ?? null,
          nome: params.nome,
          tipo: 'link',
          conteudo_json: params.conteudo!,
          status_aprovacao: 'aprovado',
        })
        setDialogOpen(false)
      } catch (err) {
        console.error('Create link artefato error:', err)
      }
      return
    }

    // tipo === 'texto' — fluxo IA existente
    if (!atividade.configuracoes.length) return
    const configuracao = params.configuracao ?? atividade.configuracoes[0]
    const artefatosAprovados = atividade.artefatos.filter(a => a.status_aprovacao === 'aprovado')

    try {
      const result = await execute({ projeto, iteracao, atividade, configuracao, nomeArtefato: params.nome, artefatosAprovados })
      setDialogOpen(false)

      await supabase.from('mensagens_agente').insert({
        iteracao_id: iteracao.id,
        disciplina: atividade.disciplina,
        agente: atividade.agente || 'SCRIBE',
        tipo: 'agent',
        conteudo: result.chatMessage,
        metadados_json: { atividade_id: atividade.id, artefato_id: result.artefato.id, versao: result.artefato.versao },
        empresa_id: user!.empresaId,
      })

      queryClient.invalidateQueries({ queryKey: ['mensagens', iteracao.id] })
      navigate(`/project/${projeto.id}/${atividade.disciplina}/resultado/${result.artefato.id}`)
    } catch (err) {
      console.error('Execute AI error:', err)
    }
  }

  const handleReexecutar = async (nomeArtefato: string) => {
    if (!atividade.configuracoes.length) return
    const configuracao = atividade.configuracoes[0]
    const artefatosAprovados = atividade.artefatos.filter(a => a.status_aprovacao === 'aprovado')

    try {
      const result = await execute({ projeto, iteracao, atividade, configuracao, nomeArtefato, artefatosAprovados })

      await supabase.from('mensagens_agente').insert({
        iteracao_id: iteracao.id,
        disciplina: atividade.disciplina,
        agente: atividade.agente || 'SCRIBE',
        tipo: 'agent',
        conteudo: result.chatMessage,
        metadados_json: { atividade_id: atividade.id, artefato_id: result.artefato.id, versao: result.artefato.versao },
        empresa_id: user!.empresaId,
      })

      queryClient.invalidateQueries({ queryKey: ['mensagens', iteracao.id] })
      navigate(`/project/${projeto.id}/${atividade.disciplina}/resultado/${result.artefato.id}`)
    } catch (err) {
      console.error('Execute AI error:', err)
    }
  }

  const handleViewArtefato = (artefato: Artefato) => {
    if (artefato.tipo === 'link') {
      const url = artefato.conteudo_json.url as string | undefined
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    navigate(`/project/${projeto.id}/${atividade.disciplina}/resultado/${artefato.id}`)
  }

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
        {atividade.total_artefatos > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/70">
                {atividade.artefatos_aprovados}/{atividade.total_artefatos} aprovados
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
        <div className="flex items-center justify-end mt-3">
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={isExecuting}
            title={
              isExecuting
                ? 'Gerando conteúdo...'
                : 'Criar novo artefato'
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
              : <Plus className="w-3 h-3" />
            }
            {isExecuting ? 'Gerando...' : 'Novo Artefato'}
          </Button>
        </div>
      </div>

      {/* Artefatos list */}
      {hasContent && (
        <div className={cn('border-t border-border/60', !expanded && 'bg-card/40')}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-left px-4 py-2"
          >
            <FileText className="w-3 h-3" />
            <span className="font-medium">
              {artefatosAgrupados.length} artefato{artefatosAgrupados.length !== 1 ? 's' : ''}
            </span>
            {expanded
              ? <ChevronUp className="w-3 h-3 ml-auto" />
              : <ChevronDown className="w-3 h-3 ml-auto" />
            }
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              {artefatosAgrupados.map(({ nome, latest, versoes }) => {
                const isLink = latest.tipo === 'link'
                const linkUrl = isLink ? (latest.conteudo_json.url as string | undefined) : undefined

                return (
                  <div
                    key={nome}
                    className="flex items-start gap-2 p-2.5 rounded-md bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
                  >
                    {/* Status / type icon */}
                    <div className="shrink-0 mt-0.5">
                      {latest.status_aprovacao === 'aprovado' && !isLink ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArtefatoTypeIcon tipo={latest.tipo ?? 'texto'} />
                      )}
                    </div>

                    {/* Name + version info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{nome}</p>
                      {isLink && linkUrl && (
                        <p className="text-[10px] text-blue-400/80 truncate mt-0.5">{linkUrl}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-muted-foreground/60">
                          v{latest.versao}
                        </span>
                        <Badge
                          variant={latest.status_aprovacao === 'aprovado' ? 'success' : 'outline'}
                          className={cn(
                            'text-[8px] h-4 px-1',
                            latest.status_aprovacao !== 'aprovado' && 'text-muted-foreground border-border'
                          )}
                        >
                          {latest.status_aprovacao === 'aprovado' ? 'Aprovado' :
                           latest.status_aprovacao === 'rascunho' ? 'Rascunho' :
                           latest.status_aprovacao === 'em_revisao' ? 'Em Revisão' : 'Rejeitado'}
                        </Badge>
                        {versoes.length > 1 && (
                          <span className="text-[9px] text-muted-foreground/50">
                            {versoes.length} versões
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewArtefato(latest)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        title={isLink ? 'Abrir link' : 'Ver resultado'}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      {!isLink && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReexecutar(nome)}
                          disabled={isExecuting || !atividade.configuracoes.length}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Regenerar com IA"
                        >
                          {isExecuting
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Sparkles className="w-3 h-3" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Dialog: novo artefato */}
      <NomeArtefatoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleExecuteNovo}
        isExecuting={isExecuting}
        iteracaoNome={iteracao.nome}
        atividadeNome={atividade.nome}
        configuracoes={atividade.configuracoes}
      />
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

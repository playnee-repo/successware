import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft, Save, ChevronRight, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import { buildInsumoContentPreview } from '@/shared/lib/insumo-preview'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { supabase } from '@/shared/api/supabase'
import { AppShell } from '@/widgets/app-shell/ui/AppShell'
import { Header } from '@/widgets/header/ui/Header'
import {
  useInsumo,
  useAtividade,
  useUpdateInsumoContent,
  useUpdateApprovalStatus,
} from '@/features/manage-artifacts/model/useArtifacts'
import { useIterations } from '@/features/manage-iterations/model/useIterations'
import { cn, formatDateTime } from '@/shared/lib/utils'
import type { Project } from '@/entities/project/model/types'
import type { InsumoProject, ApprovalStatus } from '@/entities/artifact/model/types'
import { DISCIPLINA_LABELS } from '@/entities/artifact/model/types'

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-border/60' },
  em_revisao: { label: 'Em Revisão', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
}

function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projeto', projectId],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', projectId!)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

function ResultadoEditableContent({
  insumo,
  onSaved,
}: {
  insumo: InsumoProject
  onSaved?: () => void
}) {
  const updateContent = useUpdateInsumoContent()
  const conteudo = insumo.conteudo_json as Record<string, unknown>

  const initialText = typeof conteudo?.md === 'string'
    ? conteudo.md
    : JSON.stringify(conteudo, null, 2)

  const [markdownText, setMarkdownText] = useState(initialText)

  useEffect(() => {
    const c = insumo.conteudo_json as Record<string, unknown>
    setMarkdownText(typeof c?.md === 'string' ? c.md : JSON.stringify(c, null, 2))
  }, [insumo.id, insumo.conteudo_json])

  const handleSave = async () => {
    await updateContent.mutateAsync({
      insumoId: insumo.id,
      conteudo_json: { md: markdownText },
      iteracaoId: insumo.iteracao_id,
    })
    onSaved?.()
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Barra fixa ao rolar: Salvar sempre visível e disponível */}
      <div className="sticky top-0 z-20 flex items-center justify-end gap-3 py-3 -mx-6 px-6 mb-3 bg-card/95 border-b border-border/80 backdrop-blur-sm">
        <Button
          onClick={handleSave}
          disabled={updateContent.isPending}
          className="h-9 px-4 gradient-primary border-0 text-white text-sm font-medium gap-2 shadow-lg shadow-primary/20 hover:opacity-90"
        >
          {updateContent.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {updateContent.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
      <BlockNoteField
        value={markdownText}
        onChange={setMarkdownText}
        minHeight="600px"
        placeholder="Conteúdo em Markdown... (títulos, listas, negrito, código)"
      />
    </div>
  )
}

export function ResultadoPage() {
  const { projectId, disciplina = 'requisitos', insumoId } = useParams()
  const navigate = useNavigate()
  const { data: insumo, isLoading: insumoLoading, error: insumoError } = useInsumo(insumoId)
  const { data: projeto, isLoading: projectLoading } = useProject(projectId)
  const { data: atividade } = useAtividade(insumo?.atividade_id)
  const { data: iteracoes = [] } = useIterations(projectId)
  const updateStatus = useUpdateApprovalStatus()

  const activeIteracao = useMemo(
    () => iteracoes.find((i) => i.id === insumo?.iteracao_id) ?? iteracoes.find((i) => i.status === 'ativa') ?? iteracoes[0] ?? null,
    [iteracoes, insumo?.iteracao_id]
  )

  const disciplinaLabel = DISCIPLINA_LABELS[disciplina as keyof typeof DISCIPLINA_LABELS] ?? disciplina
  const statusConfig = insumo ? STATUS_CONFIG[insumo.status_aprovacao] : null

  const handleStatusUpdate = async (status: ApprovalStatus) => {
    if (!insumo) return
    await updateStatus.mutateAsync({
      insumoId: insumo.id,
      status,
      iteracaoId: insumo.iteracao_id,
    })
  }

  if (projectLoading || insumoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Carregando resultado...</p>
        </div>
      </div>
    )
  }

  if (insumoError || !insumo || !projeto) {
    return (
      <div className="flex items-center justify-center h-screen bg-background gap-3">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-medium text-foreground">Resultado não encontrado</p>
          <p className="text-xs text-muted-foreground">Verifique o link ou volte ao projeto.</p>
          <Button variant="outline" onClick={() => navigate(`/project/${projectId}/${disciplina}`)}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const backUrl = `/project/${projectId}/${disciplina}`

  const chatContext =
    projeto && insumo && activeIteracao
      ? {
          projectId: projeto.id,
          projectName: projeto.nome,
          disciplina,
          route: 'resultado' as const,
          insumoId: insumo.id,
          insumoName: atividade?.nome,
          insumoSummary: atividade?.nome ? `${atividade.nome} · v${insumo.versao}` : `v${insumo.versao}`,
          insumoContentPreview: buildInsumoContentPreview(insumo.conteudo_json),
        }
      : undefined

  return (
    <AppShell
      iteracao={activeIteracao}
      disciplina={disciplina}
      progresso={0}
      agentId={insumo.agente_autor}
      chatContext={chatContext}
    >
      <Header
        project={projeto}
        iteracoes={iteracoes}
        activeIteracao={activeIteracao}
        disciplina={disciplina}
      />
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link
              to={`/project/${projectId}`}
              className="hover:text-foreground transition-colors"
            >
              {projeto.nome}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={backUrl}
              className="hover:text-foreground transition-colors"
            >
              {disciplinaLabel}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {atividade && (
              <>
                <span className="text-muted-foreground">{atividade.nome}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-foreground font-medium">Resultado v{insumo.versao}</span>
          </nav>

          {/* Header card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden ring-1 ring-inset ring-black/5 mb-6">
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {atividade?.nome ?? 'Resultado'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground/60">v{insumo.versao}</span>
                    {statusConfig && (
                      <Badge variant="outline" className={cn('text-[9px] h-5', statusConfig.className)}>
                        {statusConfig.label}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDateTime(insumo.atualizado_em)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground"
                  onClick={() => navigate(backUrl)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                {insumo.status_aprovacao !== 'aprovado' && (
                  <Button
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                    onClick={() => handleStatusUpdate('aprovado')}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Aprovar
                  </Button>
                )}
                {insumo.status_aprovacao === 'aprovado' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border"
                    onClick={() => handleStatusUpdate('em_revisao')}
                    disabled={updateStatus.isPending}
                  >
                    Revisar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Editable content */}
          <div className="bg-card border border-border rounded-xl p-6 ring-1 ring-inset ring-black/5">
            <ResultadoEditableContent insumo={insumo} />
          </div>
        </div>
      </ScrollArea>
    </AppShell>
  )
}

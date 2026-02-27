import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft, Save, ChevronRight, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
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
  rascunho: { label: 'Rascunho', className: 'bg-zinc-700/60 text-zinc-400 border-zinc-600/40' },
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
    <Tabs defaultValue="editar" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <TabsList className="h-8 p-0.5 bg-zinc-800/60 border border-zinc-700/40 rounded-lg w-auto inline-flex">
          <TabsTrigger
            value="editar"
            className={cn(
              'h-7 text-xs px-3 rounded-md font-medium',
              'data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100',
              'data-[state=inactive]:text-zinc-500'
            )}
          >
            Editar
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className={cn(
              'h-7 text-xs px-3 rounded-md font-medium',
              'data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100',
              'data-[state=inactive]:text-zinc-500'
            )}
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <Button
          onClick={handleSave}
          disabled={updateContent.isPending}
          className="h-8 gradient-primary border-0 text-white text-xs gap-1.5"
        >
          {updateContent.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </Button>
      </div>

      <TabsContent value="editar" className="mt-0">
        <textarea
          value={markdownText}
          onChange={(e) => setMarkdownText(e.target.value)}
          className="w-full min-h-[600px] bg-zinc-800/40 border border-zinc-700/60 rounded-lg p-4 text-sm text-zinc-300 font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 placeholder:text-zinc-600"
          placeholder="Conteúdo em Markdown..."
          spellCheck={false}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        <div className="min-h-[600px] bg-zinc-800/40 border border-zinc-700/60 rounded-lg p-6 text-sm text-zinc-300 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
              em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
              ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed text-zinc-300">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold text-zinc-100 mt-6 mb-3 first:mt-0 pb-2 border-b border-zinc-700/60">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold text-zinc-100 mt-5 mb-2 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-medium text-zinc-200 mt-4 mb-1.5 first:mt-0">{children}</h3>,
              h4: ({ children }) => <h4 className="text-sm font-medium text-zinc-300 mt-3 mb-1 first:mt-0">{children}</h4>,
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                return isBlock
                  ? <code className="block">{children}</code>
                  : <code className="bg-zinc-700/80 px-1.5 py-0.5 rounded text-[12px] font-mono text-zinc-200">{children}</code>
              },
              pre: ({ children }) => <pre className="bg-zinc-900/80 border border-zinc-700/60 p-4 rounded-lg overflow-x-auto text-[12px] my-3 font-mono text-zinc-300">{children}</pre>,
              table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse">{children}</table></div>,
              thead: ({ children }) => <thead className="bg-zinc-800/60">{children}</thead>,
              th: ({ children }) => <th className="border border-zinc-700 px-3 py-2 text-left text-zinc-200 font-semibold text-xs uppercase tracking-wider">{children}</th>,
              td: ({ children }) => <td className="border border-zinc-700 px-3 py-2 text-zinc-400">{children}</td>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/50 pl-4 italic text-zinc-500 my-3">{children}</blockquote>,
              hr: () => <hr className="border-zinc-700/60 my-4" />,
            }}
          >
            {markdownText}
          </ReactMarkdown>
        </div>
      </TabsContent>
    </Tabs>
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
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-zinc-600">Carregando resultado...</p>
        </div>
      </div>
    )
  }

  if (insumoError || !insumo || !projeto) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 gap-3">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium text-zinc-300">Resultado não encontrado</p>
          <p className="text-xs text-zinc-600">Verifique o link ou volte ao projeto.</p>
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
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
            <Link
              to={`/project/${projectId}`}
              className="hover:text-zinc-300 transition-colors"
            >
              {projeto.nome}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={backUrl}
              className="hover:text-zinc-300 transition-colors"
            >
              {disciplinaLabel}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {atividade && (
              <>
                <span className="text-zinc-500">{atividade.nome}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-zinc-300 font-medium">Resultado v{insumo.versao}</span>
          </nav>

          {/* Header card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ring-1 ring-inset ring-white/5 mb-6">
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-zinc-100">
                    {atividade?.nome ?? 'Resultado'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-zinc-600">v{insumo.versao}</span>
                    {statusConfig && (
                      <Badge variant="outline" className={cn('text-[9px] h-5', statusConfig.className)}>
                        {statusConfig.label}
                      </Badge>
                    )}
                    <span className="text-[10px] text-zinc-600">
                      {formatDateTime(insumo.atualizado_em)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-400"
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
                    className="h-8 border-zinc-700"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 ring-1 ring-inset ring-white/5">
            <ResultadoEditableContent insumo={insumo} />
          </div>
        </div>
      </ScrollArea>
    </AppShell>
  )
}

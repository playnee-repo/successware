import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, X, RotateCcw, Code2, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useUpdateApprovalStatus } from '@/features/manage-artifacts/model/useArtifacts'
import { cn, formatDateTime } from '@/shared/lib/utils'
import type { InsumoProject, ApprovalStatus } from '@/entities/artifact/model/types'

interface ArtifactEditorProps {
  insumo: InsumoProject
  onClose?: () => void
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-border/60' },
  em_revisao: { label: 'Em Revisão', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  rejeitado: { label: 'Rejeitado', className: 'bg-red-500/15 text-red-400 border-red-500/25' },
}

export function ArtifactEditor({ insumo, onClose }: ArtifactEditorProps) {
  const [activeTab, setActiveTab] = useState<string>(insumo.preferencia_view)
  const updateStatus = useUpdateApprovalStatus()
  const statusConfig = STATUS_CONFIG[insumo.status_aprovacao]

  const handleStatusUpdate = async (status: ApprovalStatus) => {
    await updateStatus.mutateAsync({
      insumoId: insumo.id,
      status,
      iteracaoId: insumo.iteracao_id,
    })
  }

  const conteudo = insumo.conteudo_json as Record<string, unknown>
  const markdownText = typeof conteudo?.md === 'string'
    ? conteudo.md
    : null

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden ring-1 ring-inset ring-black/5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/80 shrink-0 bg-card/80">
        <div className="flex items-center gap-2">
          {/* Version pill */}
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
            v{insumo.versao}
          </span>

          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn('text-[9px] h-5 px-2 border', statusConfig.className)}
          >
            {statusConfig.label}
          </Badge>

          {/* Timestamp */}
          <span className="text-[9px] text-muted-foreground/50 hidden sm:inline">
            {formatDateTime(insumo.criado_em)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {insumo.status_aprovacao !== 'aprovado' && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate('aprovado')}
              disabled={updateStatus.isPending}
              className="h-6 px-2 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0 font-medium"
            >
              {updateStatus.isPending
                ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                : <Check className="w-2.5 h-2.5" />
              }
              Aprovar
            </Button>
          )}

          {insumo.status_aprovacao === 'aprovado' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('em_revisao')}
              disabled={updateStatus.isPending}
              className="h-6 px-2 text-[10px] gap-1 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Revisar
            </Button>
          )}

          {insumo.status_aprovacao !== 'rejeitado' && insumo.status_aprovacao !== 'aprovado' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('rejeitado')}
              disabled={updateStatus.isPending}
              className="h-6 px-2 text-[10px] gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              <X className="w-2.5 h-2.5" />
              Rejeitar
            </Button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-all ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content with pill tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 pt-2 shrink-0">
          <TabsList className="h-7 p-0.5 bg-muted/60 border border-border/40 rounded-lg w-auto inline-flex">
            <TabsTrigger
              value="visual"
              className={cn(
                'h-6 text-[10px] gap-1 px-2.5 rounded-md font-medium',
                'data-[state=active]:bg-accent data-[state=active]:text-foreground',
                'data-[state=inactive]:text-muted-foreground'
              )}
            >
              <Eye className="w-3 h-3" />
              Visual
            </TabsTrigger>
            <TabsTrigger
              value="rawjson"
              className={cn(
                'h-6 text-[10px] gap-1 px-2.5 rounded-md font-medium',
                'data-[state=active]:bg-accent data-[state=active]:text-foreground',
                'data-[state=inactive]:text-muted-foreground'
              )}
            >
              <Code2 className="w-3 h-3" />
              Markdown
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="flex-1 overflow-hidden mt-0 p-3">
          <ScrollArea className="h-full">
            {markdownText ? (
              <div className="chat-markdown text-xs text-foreground leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-0">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-0">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h1: ({ children }) => <h1 className="text-base font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xs font-medium text-foreground mt-2 mb-1 first:mt-0">{children}</h3>,
                    code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-muted p-2 rounded-lg overflow-x-auto text-[11px] my-2 font-mono">{children}</pre>,
                    table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                    th: ({ children }) => <th className="border border-border px-2 py-1 text-left text-foreground bg-muted/60">{children}</th>,
                    td: ({ children }) => <td className="border border-border px-2 py-1 text-muted-foreground">{children}</td>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                  }}
                >
                  {markdownText}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed bg-muted/40 border border-border/40 rounded-lg p-4 overflow-auto">
                {JSON.stringify(insumo.conteudo_json, null, 2)}
              </pre>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rawjson" className="flex-1 overflow-hidden mt-0 p-3">
          <ScrollArea className="h-full">
            <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed bg-muted/40 border border-border/40 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
              {markdownText ?? JSON.stringify(insumo.conteudo_json, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

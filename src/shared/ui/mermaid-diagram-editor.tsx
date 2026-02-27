import { useEffect, useState, useRef, useCallback } from 'react'
import mermaid from 'mermaid'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Code, Eye } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import { cn } from '@/shared/lib/utils'
import { extractMermaidBlocks, normalizeMermaidCodeForRender } from '@/shared/lib/mermaid-utils'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  logLevel: 'error',
  flowchart: {
    useMaxWidth: false,
    padding: 24,
    nodeSpacing: 60,
    rankSpacing: 50,
  },
})

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

export interface MermaidDiagramEditorProps {
  /** Conteúdo completo (diagrama + texto em markdown) */
  value: string
  onChange: (value: string) => void
  className?: string
  /** Altura mínima da área do diagrama (ex: "400px") */
  diagramHeight?: string
}

/**
 * Editor de diagrama Mermaid: visualização principal com zoom/pan e modo edição do código.
 */
export function MermaidDiagramEditor({
  value,
  onChange,
  className,
  diagramHeight = '420px',
}: MermaidDiagramEditorProps) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const diagramCode = extractMermaidBlocks(value ?? '')[0] ?? ''
  const normalizedCode = diagramCode ? normalizeMermaidCodeForRender(diagramCode) : ''

  useEffect(() => {
    if (!normalizedCode.trim()) {
      setSvg(null)
      setError(null)
      return
    }
    const id = `mermaid-editor-${Math.random().toString(36).slice(2, 11)}`
    setError(null)
    mermaid
      .render(id, normalizedCode)
      .then(({ svg: result }) => setSvg(result))
      .catch((err: Error) => {
        setSvg(null)
        setError(err.message ?? 'Erro ao renderizar diagrama')
      })
  }, [normalizedCode])

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_ZOOM, s + ZOOM_STEP))
  }, [])
  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_ZOOM, s - ZOOM_STEP))
  }, [])
  const resetZoom = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])
  const fitToView = useCallback(() => {
    if (!viewportRef.current || !svg) return
    const rect = viewportRef.current.getBoundingClientRect()
    const scaleX = rect.width / 800 // aprox. largura do SVG
    const scaleY = rect.height / 600
    const s = Math.min(scaleX, scaleY, 1.5)
    setScale(s)
    setTranslate({ x: (rect.width - 800 * s) / 2 / s, y: (rect.height - 600 * s) / 2 / s })
  }, [svg])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setScale((s) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s + delta)))
    },
    []
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y })
  }, [translate.x, translate.y])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    },
    [isPanning, panStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  return (
    <div className={cn('mermaid-diagram-editor flex flex-col rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-700/60 bg-zinc-800/40 shrink-0">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200" onClick={zoomIn} title="Aumentar zoom">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200" onClick={zoomOut} title="Diminuir zoom">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200" onClick={resetZoom} title="Redefinir zoom (100%)">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200" onClick={fitToView} title="Ajustar à área">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <span className="ml-2 text-xs text-zinc-500 tabular-nums">{Math.round(scale * 100)}%</span>
        </div>
        <Button
          type="button"
          variant={isEditing ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setIsEditing((e) => !e)}
          title={isEditing ? 'Fechar edição' : 'Editar código e texto'}
        >
          {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
          {isEditing ? 'Ver diagrama' : 'Editar'}
        </Button>
      </div>

      {/* Área principal: diagrama com zoom/pan ou editor */}
      {isEditing ? (
        <div className="flex-1 min-h-[280px] p-4 border-t border-zinc-700/40">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Código do diagrama e texto (Markdown)</p>
          <BlockNoteField value={value ?? ''} onChange={onChange} className="min-h-[240px]" />
        </div>
      ) : (
        <div
          ref={viewportRef}
          className="relative overflow-hidden bg-zinc-900/50 flex items-center justify-center"
          style={{ minHeight: diagramHeight, cursor: isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 max-w-md text-sm text-amber-200">
                <p className="font-medium mb-1">Diagrama inválido</p>
                <p className="text-xs text-amber-200/80">{error}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setIsEditing(true)}>
                  Editar código
                </Button>
              </div>
            </div>
          )}
          {!error && !svg && normalizedCode && (
            <div className="text-zinc-500 text-sm">Carregando diagrama…</div>
          )}
          {!error && svg && (
            <div
              className="mermaid-diagram-editor__stage origin-center"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
          {!error && !svg && !normalizedCode && (
            <div className="text-zinc-500 text-sm">Nenhum diagrama. Clique em &quot;Editar&quot; para adicionar código Mermaid.</div>
          )}
        </div>
      )}
    </div>
  )
}

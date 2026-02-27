import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/shared/lib/utils'
import { normalizeMermaidCodeForRender } from '@/shared/lib/mermaid-utils'
import { useTheme } from '@/shared/lib/theme-provider'

const MERMAID_OPTS = {
  startOnLoad: false,
  securityLevel: 'loose' as const,
  logLevel: 'error' as const,
  flowchart: {
    useMaxWidth: false,
    padding: 24,
    nodeSpacing: 60,
    rankSpacing: 50,
  },
}

export interface MermaidDiagramProps {
  /** Código do diagrama (ex.: "graph TD\nA --> B") */
  code: string
  className?: string
}

/**
 * Renderiza um diagrama Mermaid a partir do código.
 * Exibe o SVG em tema escuro ou mensagem de erro se o código for inválido.
 */
export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { mode } = useTheme()
  const mermaidTheme = mode === 'dark' ? 'dark' : 'default'

  useEffect(() => {
    if (!code?.trim()) {
      setSvg(null)
      setError(null)
      return
    }
    mermaid.initialize({ ...MERMAID_OPTS, theme: mermaidTheme })
    const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`
    setError(null)
    const diagramOnly = normalizeMermaidCodeForRender(code)
    mermaid
      .render(id, diagramOnly)
      .then(({ svg: result }) => {
        setSvg(result)
      })
      .catch((err: Error) => {
        setSvg(null)
        setError(err.message ?? 'Erro ao renderizar diagrama')
      })
  }, [code, mermaidTheme])

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200',
          className
        )}
      >
        <p className="font-medium mb-1">Diagrama inválido</p>
        <p className="text-xs text-amber-200/80">{error}</p>
        <pre className="mt-2 p-2 rounded bg-background/80 text-xs overflow-auto max-h-40">
          {code}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card/40 flex items-center justify-center min-h-[120px] text-muted-foreground text-sm',
          className
        )}
      >
        Carregando diagrama…
      </div>
    )
  }

  return (
    <div
      className={cn('mermaid-diagram flex items-center justify-center overflow-auto rounded-lg bg-card/40 p-4', className)}
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

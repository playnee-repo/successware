import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/shared/lib/utils'
import { normalizeMermaidCodeForRender } from '@/shared/lib/mermaid-utils'

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

  useEffect(() => {
    if (!code?.trim()) {
      setSvg(null)
      setError(null)
      return
    }
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
  }, [code])

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
        <pre className="mt-2 p-2 rounded bg-zinc-900/80 text-xs overflow-auto max-h-40">
          {code}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div
        className={cn(
          'rounded-lg border border-zinc-700 bg-zinc-900/40 flex items-center justify-center min-h-[120px] text-zinc-500 text-sm',
          className
        )}
      >
        Carregando diagrama…
      </div>
    )
  }

  return (
    <div
      className={cn('mermaid-diagram flex items-center justify-center overflow-auto rounded-lg bg-zinc-900/40 p-4', className)}
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

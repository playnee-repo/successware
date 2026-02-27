/**
 * Extrai definições Mermaid de um texto (markdown ou plano).
 * Suporta: ```mermaid ... ```, bloco começando com "mermaid\n" ou "graph"/"flowchart"/"sequenceDiagram".
 */
export function extractMermaidBlocks(text: string): string[] {
  if (!text?.trim()) return []

  const normalized = text.replace(/\\n/g, '\n').trim()
  const blocks: string[] = []

  // 1) Blocos cercados por ```mermaid ... ```
  const fenced = /```mermaid\s*\n([\s\S]*?)```/gi
  let m: RegExpExecArray | null
  const usedRanges: [number, number][] = []
  while ((m = fenced.exec(normalized)) !== null) {
    const code = m[1].trim()
    if (code) blocks.push(code)
    usedRanges.push([m.index, m.index + m[0].length])
  }

  // 2) Se não achou fenced, verifica se o texto inteiro é um diagrama (ex.: "mermaid\ngraph TD\n...")
  const rest = usedRanges.length === 0 ? normalized : cutRanges(normalized, usedRanges)
  const restTrimmed = rest.trim()
  if (restTrimmed) {
    const firstLine = restTrimmed.split('\n')[0]?.trim() ?? ''
    const diagramStart = /^(mermaid|graph\s|flowchart\s|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie\s|requirement)/i
    if (diagramStart.test(firstLine)) {
      let code: string
      if (firstLine.toLowerCase().startsWith('mermaid')) {
        code = restTrimmed.includes('\n')
          ? restTrimmed.slice(restTrimmed.indexOf('\n') + 1).trim()
          : restTrimmed.replace(/^mermaid\s*/i, '').trim()
      } else {
        code = restTrimmed
      }
      if (code) blocks.push(code)
    }
  }

  return blocks
}

function cutRanges(str: string, ranges: [number, number][]): string {
  if (ranges.length === 0) return str
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  let out = ''
  let last = 0
  for (const [start, end] of sorted) {
    out += str.slice(last, start)
    last = end
  }
  out += str.slice(last)
  return out
}

/** Remove texto em markdown após o diagrama (ex.: **Entidades Externas:**). */
export function getDiagramCodeOnly(code: string): string {
  const lines = code.split('\n')
  const stopPattern = /^\s*(\*\*|[-*]\s|[0-9]+\.\s|[A-Z][a-zç]+:)/ // **título**, lista, Entidades:
  let end = lines.length
  for (let i = 0; i < lines.length; i++) {
    if (stopPattern.test(lines[i])) {
      end = i
      break
    }
  }
  return lines.slice(0, end).join('\n').trim()
}

/** Código pronto para render: normaliza \\ e corta markdown. */
export function normalizeMermaidCodeForRender(rawCode: string): string {
  const withNewlines = rawCode.replace(/\\/g, '\n').trim()
  return getDiagramCodeOnly(withNewlines)
}

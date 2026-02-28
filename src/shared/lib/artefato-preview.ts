const MAX_PREVIEW_LEN = 3800

/**
 * Gera um resumo em texto do conteúdo do artefato para o agente do chat.
 * Formato: { md: "..." } — retorna o texto Markdown diretamente.
 * Backward compat: se não houver .md, serializa o JSON como fallback.
 */
export function buildArtefatoContentPreview(conteudo: unknown): string {
  if (conteudo == null) return ''

  const obj = conteudo as Record<string, unknown>

  if (typeof obj?.md === 'string') {
    const text = obj.md
    return text.length > MAX_PREVIEW_LEN ? text.slice(0, MAX_PREVIEW_LEN) + '\n... (truncado)' : text
  }

  if (typeof obj?.url === 'string') {
    const meta = obj.titulo ? `${obj.titulo}: ${obj.url}` : obj.url
    return meta as string
  }

  // Fallback: JSON serializado
  try {
    const str = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo)
    return str.length > MAX_PREVIEW_LEN ? str.slice(0, MAX_PREVIEW_LEN) + '\n... (truncado)' : str
  } catch {
    return ''
  }
}

/** @deprecated Use buildArtefatoContentPreview instead */
export const buildInsumoContentPreview = buildArtefatoContentPreview

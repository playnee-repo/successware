/**
 * Utilitários de prompt — agnósticos de provedor.
 * O provedor de IA (Gemini/OpenAI) é configurado no container.ts via IAiProvider.
 */

export function buildPrompt(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (prompt, [key, value]) => prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    template
  )
}

export const FALLBACK_SYSTEM_PROMPT = `Você é um agente de IA especialista em engenharia de software.
Retorne SEMPRE um documento Markdown bem estruturado.
NÃO retorne JSON. Retorne APENAS Markdown válido.`

export const FALLBACK_CHAT_SYSTEM_PROMPT = `Você é um agente especialista no contexto atual do projeto.
Suas respostas devem ser SEMPRE baseadas em: (1) o conteúdo original do insumo/projeto quando fornecido, (2) o contexto do projeto e da disciplina, e (3) a conversa com o usuário.
Ajude a melhorar os itens gerados com sugestões concretas que o usuário possa copiar e aplicar. Responda em Markdown.`

/** Monta o trecho de contexto atual para injetar no system prompt do chat. */
export function buildChatContextPrompt(context: {
  projectName?: string
  disciplina?: string
  route: string
  insumoName?: string
  insumoSummary?: string
  insumoContentPreview?: string
}): string {
  const parts: string[] = ['Contexto atual do usuário:']
  if (context.projectName) parts.push(`- Projeto: ${context.projectName}`)
  if (context.disciplina) parts.push(`- Disciplina: ${context.disciplina}`)
  parts.push(`- Tela: ${context.route === 'resultado' ? 'Resultado (edição de insumo)' : 'Lista de atividades do projeto'}`)
  if (context.route === 'resultado' && (context.insumoName || context.insumoSummary)) {
    if (context.insumoName) parts.push(`- Insumo em foco: ${context.insumoName}`)
    if (context.insumoSummary) parts.push(`- Resumo: ${context.insumoSummary}`)
  }
  if (context.insumoContentPreview?.trim()) {
    parts.push('', 'Conteúdo atual do insumo (use como base para sugerir melhorias):', context.insumoContentPreview.trim())
  }
  parts.push('', 'Regra: baseie suas respostas sempre no conteúdo original acima, no contexto do projeto e na conversa com o usuário. Dê sugestões concretas em Markdown.')
  return parts.join('\n')
}

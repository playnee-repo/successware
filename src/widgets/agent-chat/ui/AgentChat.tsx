import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, User, Loader2, Sparkles, MapPin, Copy, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { cn } from '@/shared/lib/utils'
import { FALLBACK_CHAT_SYSTEM_PROMPT, buildChatContextPrompt } from '@/shared/config/gemini'
import { getAiProvider } from '@/shared/api/container'
import type { AiMessage } from '@/shared/api/IAiProvider'
import { useAllAgentes } from '@/features/manage-admin/model/useAdminAgentes'
import { getAgenteColor } from '@/shared/lib/agent-colors'
import type { ChatContext } from '@/entities/agent/model/types'
import type { AgenteConfig } from '@/entities/admin/model/types'

/** Mensagem em memória (conversa não é salva; ao sair e voltar, recomeça). */
interface ChatMessage {
  id: string
  tipo: 'user' | 'agent'
  conteudo: string
  criado_em: string
}

interface AgentChatProps {
  iteracaoId: string
  disciplina: string
  agente?: string
  /** Contexto atual (projeto, tela, insumo + conteúdo) para o agente sugerir melhorias. */
  chatContext?: ChatContext
}

async function getAgentReply(
  chatContext: ChatContext | undefined,
  messages: ChatMessage[],
  userContent: string,
  agentConfig: AgenteConfig | null
): Promise<string> {
  const contextPrompt = chatContext
    ? buildChatContextPrompt({
        projectName: chatContext.projectName,
        disciplina: chatContext.disciplina,
        route: chatContext.route,
        insumoName: chatContext.artefatoName,
        insumoSummary: chatContext.artefatoSummary,
        insumoContentPreview: chatContext.artefatoContentPreview,
      })
    : ''
  const basePrompt = agentConfig?.chat_system_prompt ?? FALLBACK_CHAT_SYSTEM_PROMPT
  const systemPrompt = basePrompt + (contextPrompt ? `\n\n${contextPrompt}` : '')

  const history: AiMessage[] = messages.map((msg) => ({
    role: msg.tipo === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.conteudo,
  }))

  const aiProvider = await getAiProvider()
  const reply = await aiProvider.chatComplete(systemPrompt, history, userContent, agentConfig)
  return reply || 'Não consegui gerar uma resposta.'
}

function MessageBubble({ message, agentAbbr = 'SC' }: { message: ChatMessage; agentAbbr?: string }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.tipo === 'user'
  const date = new Date(message.criado_em)
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.conteudo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-2.5 mb-4 animate-fade-in',
        isUser && 'flex-row-reverse'
      )}
    >
      <div className="shrink-0 mt-0.5">
        <Avatar className="w-7 h-7">
          <AvatarFallback
            className={cn(
              'text-xs font-bold',
              isUser
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/20 text-primary'
            )}
          >
            {isUser ? <User className="w-3 h-3" /> : agentAbbr}
          </AvatarFallback>
        </Avatar>
      </div>
      <div
        className={cn(
          'flex flex-col gap-1.5 max-w-[82%]',
          isUser && 'items-end'
        )}
      >
        <div
          className={cn(
            'px-3.5 py-2.5 text-xs leading-relaxed',
            isUser
              ? 'chat-bubble-user text-foreground'
              : 'chat-bubble-agent text-foreground chat-markdown group/bubble'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.conteudo}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-0">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-0">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  hr: () => <hr className="border-border/80 my-3" />,
                  h1: ({ children }) => <p className="font-semibold text-foreground mt-2 mb-1 first:mt-0">{children}</p>,
                  h2: ({ children }) => <p className="font-semibold text-foreground mt-2 mb-1 first:mt-0">{children}</p>,
                  h3: ({ children }) => <p className="font-medium text-foreground mt-2 mb-1 first:mt-0">{children}</p>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{children}</code>,
                  pre: ({ children }) => <pre className="bg-muted p-2 rounded-lg overflow-x-auto text-[11px] my-2">{children}</pre>,
                }}
              >
                {message.conteudo}
              </ReactMarkdown>
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50 opacity-70 group-hover/bubble:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground/50 px-1">{timeStr}</span>
      </div>
    </div>
  )
}

function contextSummary(ctx: ChatContext): string {
  const parts: string[] = []
  if (ctx.projectName) parts.push(ctx.projectName)
  if (ctx.disciplina) {
    const d = ctx.disciplina === 'requisitos' ? 'Requisitos' : ctx.disciplina
    parts.push(d)
  }
  if (ctx.route === 'resultado' && (ctx.artefatoName || ctx.artefatoSummary)) {
    parts.push(ctx.artefatoName ?? ctx.artefatoSummary ?? 'Resultado')
  }
  return parts.join(' · ')
}

export function AgentChat({
  iteracaoId,
  disciplina,
  agente = 'SCRIBE',
  chatContext,
}: AgentChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const capped = Math.min(Math.max(el.scrollHeight, 44), 140)
    el.style.height = `${capped}px`
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])
  const { data: agentes = [] } = useAllAgentes()
  const agentCfg = agentes.find((a) => a.id === agente) ?? null
  const agentColors = getAgenteColor(agente)

  const sendMutation = useMutation({
    mutationFn: ({ conteudo, currentMessages }: { conteudo: string; currentMessages: ChatMessage[] }) =>
      getAgentReply(chatContext, currentMessages, conteudo, agentCfg),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sendMutation.isPending) return
    setInput('')

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      tipo: 'user',
      conteudo: trimmed,
      criado_em: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const reply = await sendMutation.mutateAsync({
        conteudo: trimmed,
        currentMessages: messages,
      })
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        tipo: 'agent',
        conteudo: reply,
        criado_em: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, agentMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          tipo: 'agent',
          conteudo: 'Ocorreu um erro ao obter a resposta. Tente novamente.',
          criado_em: new Date().toISOString(),
        },
      ])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const contextLine = chatContext ? contextSummary(chatContext) : ''

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 border-b border-border/60">
        <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="w-9 h-9">
                <AvatarFallback className={cn(agentColors.bg, agentColors.text, 'text-xs font-bold border border-primary/20')}>
                  {agentColors.abbr}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{agente}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  ONLINE
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto mt-0.5 pr-1 text-[10px] text-muted-foreground leading-snug">
                <p>
                  {agentCfg?.descricao ?? 'Especialista no projeto e no contexto atual. Ajuda a melhorar os itens gerados.'}
                </p>
              </div>
              {contextLine && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground bg-muted/50 border border-border/40 rounded-md px-2 py-1">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{contextLine}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center ring-inset-subtle">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Conversa não é salva</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1 leading-snug">
                {contextLine
                  ? 'Peça melhorias nos itens (ex.: "melhore o X"). O agente sugere versões para você copiar e aplicar.'
                  : 'Envie uma mensagem para começar. Ao sair e voltar, a conversa recomeça.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} agentAbbr={agentColors.abbr} />
            ))}
            {sendMutation.isPending && (
              <div className="flex gap-2.5 mb-4">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className={cn(agentColors.bg, agentColors.text, 'text-xs font-bold')}>
                    {agentColors.abbr}
                  </AvatarFallback>
                </Avatar>
                <div className="chat-bubble-agent px-3.5 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-pulse-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </ScrollArea>

      <div className="px-3 py-3 border-t border-border/60 shrink-0 bg-background">
        <div className="flex gap-2.5 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              chatContext?.route === 'resultado'
                ? 'Peça melhorias com base no conteúdo...'
                : 'Digite sua mensagem...'
            }
            className={cn(
              'min-h-[44px] max-h-[140px] py-2.5 px-3 text-sm leading-snug resize-none overflow-y-auto',
              'bg-card/90 border border-border text-foreground placeholder:text-muted-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/50',
              'rounded-xl transition-[box-shadow,border-color]'
            )}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className={cn(
              'shrink-0 h-10 w-10 rounded-xl',
              'gradient-primary border-0 text-white',
              'hover:opacity-90 disabled:opacity-30',
              'shadow-md shadow-primary/20'
            )}
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
          Enter envia · Shift+Enter quebra linha
        </p>
      </div>
    </div>
  )
}

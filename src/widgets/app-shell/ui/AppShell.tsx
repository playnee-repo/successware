import { useState, useRef } from 'react'
import { Sparkles, GripVertical } from 'lucide-react'
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar'
import { AgentChat } from '@/widgets/agent-chat/ui/AgentChat'
import type { Iteration } from '@/entities/iteration/model/types'
import type { ChatContext } from '@/entities/agent/model/types'

const CHAT_WIDTH_KEY = 'app-shell-chat-width'
const CHAT_WIDTH_MIN = 280
const CHAT_WIDTH_MAX = 640
const CHAT_WIDTH_DEFAULT = 340

function getStoredChatWidth(): number {
  try {
    const v = localStorage.getItem(CHAT_WIDTH_KEY)
    if (v != null) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n) && n >= CHAT_WIDTH_MIN && n <= CHAT_WIDTH_MAX) return n
    }
  } catch {
    /* ignore */
  }
  return CHAT_WIDTH_DEFAULT
}

interface AppShellProps {
  iteracao: Iteration | null
  disciplina?: string
  progresso?: number
  /** ID do agente para o chat (ex.: SCRIBE, ARCH). Usado para buscar config e prompt do DB. */
  agentId?: string
  /** Contexto atual (projeto, tela, insumo) para o agente sugerir melhorias. */
  chatContext?: ChatContext
  children: React.ReactNode
}

export function AppShell({ iteracao, disciplina = 'requisitos', progresso = 0, agentId, chatContext, children }: AppShellProps) {
  const [chatWidth, setChatWidth] = useState(getStoredChatWidth)
  const resizeRef = useRef({ startX: 0, startWidth: 0 })
  const lastWidthRef = useRef(chatWidth)

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    resizeRef.current = { startX: e.clientX, startWidth: chatWidth }
    lastWidthRef.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      const { startX, startWidth } = resizeRef.current
      const delta = startX - ev.clientX
      const next = Math.max(CHAT_WIDTH_MIN, Math.min(CHAT_WIDTH_MAX, Math.round(startWidth + delta)))
      lastWidthRef.current = next
      setChatWidth(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      try {
        localStorage.setItem(CHAT_WIDTH_KEY, String(lastWidthRef.current))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar iteracao={iteracao} progresso={progresso} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>

      {/* Resize handle */}
      <div
        role="separator"
        aria-label="Redimensionar painel do chat"
        onMouseDown={handleResizeMouseDown}
        className="shrink-0 w-1.5 flex flex-col items-center justify-center bg-card/80 hover:bg-accent/80 border-l border-border/60 cursor-col-resize transition-colors group"
        style={{ minWidth: 6 }}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Agent Chat Panel */}
      <div
        className="shrink-0 border-l border-border/60 flex flex-col overflow-hidden bg-background"
        style={{ width: chatWidth }}
      >
        {iteracao ? (
          <AgentChat
            iteracaoId={iteracao.id}
            disciplina={disciplina}
            agente={agentId}
            chatContext={chatContext}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center ring-inset-subtle">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Agente inativo</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1 leading-snug">
                Selecione uma iteração ativa para iniciar o chat com o agente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

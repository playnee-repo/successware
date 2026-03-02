import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Search, FileText, Hammer, Shield, Layers,
  TrendingUp, Zap, Settings, CircleDot, BookOpen,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useDisciplinas } from '@/features/manage-artifacts/model/useArtifacts'
import { useAllAgentes } from '@/features/manage-admin/model/useAdminAgentes'
import { getAgenteColor } from '@/shared/lib/agent-colors'
import { useProjectProgress } from '@/entities/project/model/useProjectProgress'
import type { Iteration } from '@/entities/iteration/model/types'

interface DisciplinaConfig {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  agente: string
  color: string
  agentColor: string
  dotColor: string
}

const DEFAULT_DISCIPLINAS: Record<string, Omit<DisciplinaConfig, 'id'>> = {
  descoberta: {
    label: 'Descoberta',
    icon: Search,
    agente: 'SCRIBE',
    color: 'text-violet-400',
    agentColor: 'bg-violet-500/20 text-violet-400',
    dotColor: 'bg-violet-500',
  },
  requisitos: {
    label: 'Eng. Requisitos',
    icon: FileText,
    agente: 'SCRIBE',
    color: 'text-indigo-400',
    agentColor: 'bg-indigo-500/20 text-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  arquitetura: {
    label: 'Arquitetura',
    icon: Layers,
    agente: 'ARCH',
    color: 'text-blue-400',
    agentColor: 'bg-blue-500/20 text-blue-400',
    dotColor: 'bg-blue-500',
  },
  construcao: {
    label: 'Construção',
    icon: Hammer,
    agente: 'FORGE',
    color: 'text-orange-400',
    agentColor: 'bg-orange-500/20 text-orange-400',
    dotColor: 'bg-orange-500',
  },
  qualidade: {
    label: 'Qualidade',
    icon: Shield,
    agente: 'GUARDIAN',
    color: 'text-emerald-400',
    agentColor: 'bg-emerald-500/20 text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
}

const DEFAULT_ORDER = ['descoberta', 'requisitos', 'arquitetura', 'construcao', 'qualidade']

const FALLBACK_CONFIG: Omit<DisciplinaConfig, 'id'> = {
  label: '',
  icon: CircleDot,
  agente: 'SCRIBE',
  color: 'text-cyan-400',
  agentColor: 'bg-cyan-500/20 text-cyan-400',
  dotColor: 'bg-cyan-500',
}

function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

interface SidebarProps {
  iteracao: Iteration | null
  progresso?: number
}

export function Sidebar({ iteracao, progresso = 0 }: SidebarProps) {
  const { projectId, disciplina: activeDisciplina } = useParams()
  const { data: dbDisciplinas = [] } = useDisciplinas()
  const { data: agentes = [] } = useAllAgentes()
  const { data: disciplinasProgresso = [] } = useProjectProgress(projectId ?? '')
  const agentesAtivos = agentes.filter((a) => a.ativo)

  const disciplinas: DisciplinaConfig[] = useMemo(() => {
    const defaultItems: DisciplinaConfig[] = DEFAULT_ORDER
      .filter(id => dbDisciplinas.length === 0 || dbDisciplinas.includes(id))
      .map(id => ({ id, ...DEFAULT_DISCIPLINAS[id] }))

    const customItems: DisciplinaConfig[] = dbDisciplinas
      .filter(id => !DEFAULT_ORDER.includes(id))
      .map(id => ({
        id,
        ...FALLBACK_CONFIG,
        label: toTitleCase(id),
      }))

    return [...defaultItems, ...customItems]
  }, [dbDisciplinas])

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border/60 w-60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border/60">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 glow-primary ring-inset-subtle">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight">SDLC Copilot</span>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 leading-none">Eng. Assistida por IA</p>
        </div>
      </div>

      {/* Disciplines */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5">
        {/* Documentos do Projeto */}
        <div className="px-2">
          <Link
            to={`/project/${projectId}/documentos`}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-150',
              'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-primary/70" />
            <span className="text-xs font-medium">Documentos do Projeto</span>
          </Link>
        </div>

        <div className="mx-4 border-t border-sidebar-border/60" />

        {/* Disciplinas section */}
        <div>
          <div className="px-4 mb-2">
            <p className="text-[9px] text-sidebar-foreground/40 uppercase tracking-widest font-semibold">
              Disciplinas
            </p>
          </div>

          <nav className="space-y-0.5 px-2">
            {disciplinas.map((disc) => {
              const isActive = activeDisciplina === disc.id
              const Icon = disc.icon
              const dp = disciplinasProgresso.find(d => d.disciplina === disc.id)
              const progress = dp?.progresso ?? 0
              const hasWork = (dp?.total_artefatos ?? 0) > 0
              return (
                <Link
                  key={disc.id}
                  to={`/project/${projectId}/${disc.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative',
                    isActive
                      ? 'sidebar-item-active'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary' : disc.color
                  )} />
                  <span className={cn(
                    'flex-1 text-xs font-medium truncate',
                    isActive ? 'text-sidebar-primary' : ''
                  )}>
                    {disc.label}
                  </span>
                  {isActive ? (
                    <span className={cn(
                      'text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0',
                      disc.agentColor
                    )}>
                      {disc.agente}
                    </span>
                  ) : hasWork ? (
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0',
                      progress >= 80
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    )}>
                      {progress}%
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Separator */}
        <div className="mx-4 border-t border-sidebar-border/60" />

        {/* Agents section */}
        <div>
          <div className="px-4 mb-2">
            <p className="text-[9px] text-sidebar-foreground/40 uppercase tracking-widest font-semibold">
              Agentes
            </p>
          </div>

          <div className="px-2 space-y-1">
            {agentesAtivos.map((agent) => {
              const colors = getAgenteColor(agent.id)
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md group"
                >
                  <div className={cn(
                    'w-6 h-6 rounded-md text-[9px] font-bold flex items-center justify-center shrink-0 ring-inset-subtle',
                    colors.bg,
                    colors.text
                  )}>
                    {colors.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-sidebar-foreground block leading-none">
                      {agent.id}
                    </span>
                    <p className="text-[9px] text-sidebar-foreground/40 leading-none mt-0.5 truncate">
                      {agent.descricao ?? agent.nome}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-sidebar-foreground/30" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Admin Link */}
      <div className="px-3 pb-2 shrink-0">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-2.5 py-2 rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-150 text-xs font-medium"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span>Admin</span>
        </Link>
      </div>

      {/* Iteration Progress Footer */}
      {iteracao && (
        <div className="p-3 border-t border-sidebar-border/60 shrink-0">
          <div className="bg-sidebar-accent/30 border border-sidebar-border rounded-lg p-3 space-y-2.5 ring-inset-subtle">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-sidebar-primary shrink-0" />
              <span className="text-[11px] font-semibold text-sidebar-foreground truncate flex-1">
                {iteracao.nome}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-sidebar-foreground/40 uppercase tracking-wider">Progresso</span>
                <span className="text-[11px] font-bold text-sidebar-primary">{progresso}%</span>
              </div>
              <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>

            <div className={cn(
              'inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md',
              iteracao.status === 'ativa'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-sidebar-border/50 text-sidebar-foreground/50 border border-sidebar-border'
            )}>
              <div className={cn(
                'w-1 h-1 rounded-full',
                iteracao.status === 'ativa' ? 'bg-emerald-500 animate-pulse' : 'bg-sidebar-foreground/30'
              )} />
              {iteracao.status.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

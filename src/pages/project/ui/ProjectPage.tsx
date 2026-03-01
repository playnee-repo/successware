import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle, Layers, Zap } from 'lucide-react'
import { supabase } from '@/shared/api/supabase'
import { AppShell } from '@/widgets/app-shell/ui/AppShell'
import { Header } from '@/widgets/header/ui/Header'
import { ActivityGrid } from '@/widgets/activity-grid/ui/ActivityGrid'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useIterations } from '@/features/manage-iterations/model/useIterations'
import { useAtividadesComProgresso, useAtividades } from '@/features/manage-artifacts/model/useArtifacts'
import { cn } from '@/shared/lib/utils'
import type { Project } from '@/entities/project/model/types'
import type { Iteration } from '@/entities/iteration/model/types'
import type { Disciplina } from '@/entities/artifact/model/types'
import { useProjectProgress, calcularProgressoGlobal } from '@/entities/project/model/useProjectProgress'

function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projeto', projectId],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', projectId)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

const DISCIPLINA_TITLES: Record<string, string> = {
  descoberta: 'Descoberta',
  requisitos: 'Engenharia de Requisitos',
  arquitetura: 'Arquitetura',
  construcao: 'Construção',
  qualidade: 'Qualidade',
}

const DISCIPLINA_DESCRIPTIONS: Record<string, string> = {
  descoberta: 'Levantamento inicial de necessidades, stakeholders e contexto de negócio.',
  requisitos: 'Elicitação, documentação e validação de requisitos funcionais e não-funcionais.',
  arquitetura: 'Design da arquitetura do sistema, modelo de dados e decisões técnicas.',
  construcao: 'Implementação das funcionalidades conforme os requisitos aprovados.',
  qualidade: 'Plano de testes, validação e revisão de segurança do sistema.',
}

const DISCIPLINA_ACCENT: Record<string, string> = {
  descoberta: 'from-violet-600/10',
  requisitos: 'from-indigo-600/10',
  arquitetura: 'from-blue-600/10',
  construcao: 'from-orange-600/10',
  qualidade: 'from-emerald-600/10',
}

const DISCIPLINA_ICON_COLOR: Record<string, string> = {
  descoberta: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  requisitos: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  arquitetura: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  construcao: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  qualidade: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const DISCIPLINA_PROGRESS_COLOR: Record<string, string> = {
  descoberta: 'text-violet-400',
  requisitos: 'text-indigo-400',
  arquitetura: 'text-blue-400',
  construcao: 'text-orange-400',
  qualidade: 'text-emerald-400',
}

interface DisciplinaViewProps {
  disciplina: Disciplina
  projeto: Project
  iteracao: Iteration
}

function DisciplinaView({ disciplina, projeto, iteracao }: DisciplinaViewProps) {
  const { data: atividades = [], isLoading } = useAtividadesComProgresso(disciplina, iteracao.id)

  const totalProgresso = atividades.length > 0
    ? Math.round(atividades.reduce((sum, a) => sum + a.progresso, 0) / atividades.length)
    : 0

  const insumosAprovados = atividades.reduce((sum, a) => sum + a.artefatos_aprovados, 0)
  const totalInsumos = atividades.reduce((sum, a) => sum + a.total_artefatos, 0)

  const accentGradient = DISCIPLINA_ACCENT[disciplina] ?? 'from-indigo-600/10'
  const iconClass = DISCIPLINA_ICON_COLOR[disciplina] ?? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  const progressColor = DISCIPLINA_PROGRESS_COLOR[disciplina] ?? 'text-indigo-400'

  return (
    <div className="space-y-6">
      {/* Discipline header card */}
      <div className={cn(
        'bg-card border border-border rounded-xl overflow-hidden ring-1 ring-inset ring-black/5',
      )}>
        <div className={cn(
          'px-6 py-5 bg-gradient-to-r via-transparent to-transparent',
          accentGradient
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ring-inset-subtle',
                iconClass
              )}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {DISCIPLINA_TITLES[disciplina] ?? disciplina.charAt(0).toUpperCase() + disciplina.slice(1).replace(/_/g, ' ')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-md">
                  {DISCIPLINA_DESCRIPTIONS[disciplina] ?? `Atividades da disciplina ${disciplina}.`}
                </p>
              </div>
            </div>

            {totalInsumos > 0 && (
              <div className="text-right shrink-0">
                <p className={cn('text-2xl font-black leading-none', progressColor)}>
                  {totalProgresso}%
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {insumosAprovados}/{totalInsumos} aprovados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Grid */}
      <ActivityGrid
        atividades={atividades}
        projeto={projeto}
        iteracao={iteracao}
        isLoading={isLoading}
      />
    </div>
  )
}

function NoIteracaoMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-24">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center ring-inset-subtle">
          <Layers className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg gradient-primary flex items-center justify-center ring-inset-subtle">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">Nenhuma iteração ativa</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          Use o seletor no cabeçalho para ativar ou criar uma iteração e começar a trabalhar.
        </p>
      </div>
    </div>
  )
}

export function ProjectPage() {
  const { projectId, disciplina = 'requisitos' } = useParams()
  const { data: projeto, isLoading: projectLoading, error: projectError } = useProject(projectId!)
  const { data: iteracoes = [], isLoading: iteracoesLoading } = useIterations(projectId!)
  const { data: atividades = [] } = useAtividades(disciplina)

  const activeIteracao = iteracoes.find(i => i.status === 'ativa') ?? iteracoes[0] ?? null
  const agentId = atividades[0]?.agente ?? 'SCRIBE'

  const { data: disciplinasProgresso = [] } = useProjectProgress(projectId!)
  const globalProgress = calcularProgressoGlobal(disciplinasProgresso)

  if (projectLoading || iteracoesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (projectError || !projeto) {
    return (
      <div className="flex items-center justify-center h-screen bg-background gap-3">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm font-medium text-foreground">Projeto não encontrado</p>
          <p className="text-xs text-muted-foreground">Verifique o link ou volte ao painel principal.</p>
        </div>
      </div>
    )
  }

  const chatContext = projeto && activeIteracao
    ? {
        projectId: projeto.id,
        projectName: projeto.nome,
        disciplina,
        route: 'project' as const,
      }
    : undefined

  return (
    <AppShell
      iteracao={activeIteracao}
      disciplina={disciplina}
      progresso={globalProgress}
      agentId={agentId}
      chatContext={chatContext}
      projeto={projeto}
    >
      {/* Header */}
      <Header
        project={projeto}
        iteracoes={iteracoes}
        activeIteracao={activeIteracao}
        disciplina={disciplina}
      />

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {!activeIteracao ? (
            <NoIteracaoMessage />
          ) : (
            <DisciplinaView
              key={`${activeIteracao.id}-${disciplina}`}
              disciplina={disciplina as Disciplina}
              projeto={projeto}
              iteracao={activeIteracao}
            />
          )}
        </div>
      </ScrollArea>
    </AppShell>
  )
}

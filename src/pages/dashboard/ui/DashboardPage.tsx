import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, ArrowRight, Loader2, FolderOpen,
  Building2, Calendar, Activity, Zap, GitBranch, Sparkles
} from 'lucide-react'
import { supabase } from '@/shared/api/supabase'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/shared/ui/dialog'
import { ThemeToggle } from '@/shared/ui/theme-toggle'
import { ThemeSelector } from '@/shared/ui/theme-selector'
import { cn, formatDate } from '@/shared/lib/utils'
import type { Project, ProjectStatus } from '@/entities/project/model/types'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' }> = {
  ativo: { label: 'Ativo', variant: 'success' },
  pausado: { label: 'Pausado', variant: 'warning' },
  concluido: { label: 'Concluído', variant: 'info' as 'secondary' },
  arquivado: { label: 'Arquivado', variant: 'secondary' },
}

const STATUS_INDICATOR: Record<ProjectStatus, string> = {
  ativo: 'bg-emerald-500',
  pausado: 'bg-amber-500',
  concluido: 'bg-blue-500',
  arquivado: 'bg-zinc-600',
}

function useProjects() {
  return useQuery({
    queryKey: ['projetos'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })
}

function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, descricao, empresa }: { nome: string; descricao?: string; empresa?: string }) => {
      const { data, error } = await supabase
        .from('projetos')
        .insert({ nome, descricao, empresa })
        .select()
        .single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
    },
  })
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const statusConfig = STATUS_CONFIG[project.status]
  const indicatorColor = STATUS_INDICATOR[project.status]

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer',
        'card-hover ring-1 ring-inset ring-white/5 dark:ring-white/5',
        'hover:border-border/80 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-black/30'
      )}
      onClick={() => navigate(`/project/${project.id}/requisitos`)}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
              'bg-primary/10 border border-primary/20 ring-inset-subtle',
              'group-hover:bg-primary/20 group-hover:border-primary/30'
            )}>
              <FolderOpen className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                {project.nome}
              </h3>
              {project.empresa && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground truncate">{project.empresa}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status badge — top right */}
          <Badge variant={statusConfig.variant} className="shrink-0 text-[9px] h-5 px-2 gap-1">
            <div className={cn('w-1 h-1 rounded-full shrink-0', indicatorColor)} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Description */}
        {project.descricao && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-4">
            {project.descricao}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.criado_em)}</span>
          </div>

          <div className={cn(
            'flex items-center gap-1 text-[11px] font-medium text-primary',
            'opacity-0 group-hover:opacity-100 transition-all duration-200',
            'translate-x-1 group-hover:translate-x-0'
          )}>
            <span>Abrir</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [showNew, setShowNew] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [empresa, setEmpresa] = useState('')
  const { data: projects = [], isLoading } = useProjects()
  const createProject = useCreateProject()
  const navigate = useNavigate()

  const activeProjects = projects.filter(p => p.status === 'ativo').length
  const totalProjects = projects.length

  const handleCreate = async () => {
    if (!nome.trim()) return
    const project = await createProject.mutateAsync({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      empresa: empresa.trim() || undefined,
    })
    setNome('')
    setDescricao('')
    setEmpresa('')
    setShowNew(false)
    navigate(`/project/${project.id}/requisitos`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-primary ring-inset-subtle">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">SDLC Copilot</h1>
              <p className="text-[10px] text-muted-foreground">Plataforma de Engenharia Assistida por IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector />
            <ThemeToggle />
            <Button
              onClick={() => setShowNew(true)}
              className="h-8 px-3 text-xs gap-1.5 gradient-primary border-0 text-white hover:opacity-90 shadow-lg shadow-primary/20 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative overflow-hidden bg-background border-b border-border">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-3xl rounded-full" />

        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Bem-vindo ao
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2 text-foreground">
            SDLC Copilot
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Gerencie todo o ciclo de desenvolvimento de software com agentes de IA especializados — da descoberta à qualidade.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Projetos Ativos',
              value: activeProjects,
              icon: Activity,
              color: 'text-primary',
              iconBg: 'bg-primary/10 border-primary/20',
              cardBorder: 'border-border',
              accentBar: 'card-accent-indigo',
            },
            {
              label: 'Total de Projetos',
              value: totalProjects,
              icon: FolderOpen,
              color: 'text-muted-foreground',
              iconBg: 'bg-muted border-border',
              cardBorder: 'border-border',
              accentBar: '',
            },
            {
              label: 'Agentes IA',
              value: 4,
              icon: GitBranch,
              color: 'text-emerald-400',
              iconBg: 'bg-emerald-500/10 border-emerald-500/20',
              cardBorder: 'border-zinc-800',
              accentBar: 'card-accent-emerald',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className={cn(
                'bg-card border border-border rounded-xl p-5 flex items-center gap-4',
                'ring-1 ring-inset ring-white/5 dark:ring-white/5 overflow-hidden',
                stat.accentBar
              )}
            >
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ring-inset-subtle',
                stat.iconBg
              )}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-foreground">Projetos</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{projects.length} projeto(s) no total</p>
            </div>
            {projects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNew(true)}
                className="h-7 px-2.5 text-[11px] gap-1.5 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="w-3 h-3" />
                Criar
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-40 rounded-xl bg-card border border-border animate-pulse"
            />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center ring-inset-subtle">
                  <FolderOpen className="w-9 h-9 text-muted-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg gradient-primary flex items-center justify-center ring-inset-subtle">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Nenhum projeto ainda</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                  Crie seu primeiro projeto para começar a usar os agentes de IA do SDLC Copilot.
                </p>
              </div>
              <Button
                onClick={() => setShowNew(true)}
                className="h-9 px-4 text-sm gap-2 gradient-primary border-0 text-white hover:opacity-90 shadow-lg shadow-primary/20 font-medium"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Projeto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center ring-inset-subtle">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <DialogTitle className="text-foreground text-base font-bold">Novo Projeto</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
              Configure seu projeto para começar a trabalhar com os agentes de IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Nome do Projeto *
              </label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: E-commerce Platform"
                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Empresa / Cliente
              </label>
              <Input
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                placeholder="Ex: Acme Corp"
                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Descrição
              </label>
              <BlockNoteField
                value={descricao}
                onChange={setDescricao}
                placeholder="Descreva o objetivo principal do projeto"
                minHeight="100px"
                className="border-border"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNew(false)}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!nome.trim() || createProject.isPending}
              className="gradient-primary border-0 text-white hover:opacity-90 shadow-md shadow-primary/20 font-medium"
            >
              {createProject.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Criar e Abrir
                  </>
                )
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

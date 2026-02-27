import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Bell, Home, Plus, Check, Loader2, Zap, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import { useCreateIteration, useActivateIteration } from '@/features/manage-iterations/model/useIterations'
import { cn } from '@/shared/lib/utils'
import type { Iteration } from '@/entities/iteration/model/types'
import type { Project } from '@/entities/project/model/types'

interface HeaderProps {
  project: Project
  iteracoes: Iteration[]
  activeIteracao: Iteration | null
  disciplina?: string
}

const DISCIPLINA_LABELS: Record<string, string> = {
  descoberta: 'Descoberta',
  requisitos: 'Eng. Requisitos',
  arquitetura: 'Arquitetura',
  construcao: 'Construção',
  qualidade: 'Qualidade',
}

export function Header({ project, iteracoes, activeIteracao, disciplina }: HeaderProps) {
  const navigate = useNavigate()
  const [showNewIteracao, setShowNewIteracao] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newModulo, setNewModulo] = useState('')
  const createIteration = useCreateIteration()
  const activateIteration = useActivateIteration()

  const disciplinaLabel = disciplina ? (DISCIPLINA_LABELS[disciplina] ?? disciplina) : null

  const handleCreate = async () => {
    if (!newNome.trim()) return
    await createIteration.mutateAsync({
      projeto_id: project.id,
      nome: newNome.trim(),
      modulo_foco: newModulo.trim() || undefined,
    })
    setNewNome('')
    setNewModulo('')
    setShowNewIteracao(false)
  }

  const handleActivate = async (iteracaoId: string) => {
    await activateIteration.mutateAsync({ iteracaoId, projetoId: project.id })
  }

  return (
    <header className="flex items-center gap-2 px-5 py-0 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm shrink-0 z-10 h-12">
      {/* Breadcrumb left */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />

        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded gradient-primary flex items-center justify-center shrink-0">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-200 truncate max-w-[140px]">
            {project.nome}
          </span>
        </div>

        {disciplinaLabel && (
          <>
            <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
            <span className="text-xs font-medium text-indigo-400 truncate max-w-[120px]">
              {disciplinaLabel}
            </span>
          </>
        )}
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Iteration Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-7 px-2.5 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 max-w-[220px]"
          >
            {activeIteracao ? (
              <>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  activeIteracao.status === 'ativa' ? 'bg-emerald-500' :
                  activeIteracao.status === 'concluida' ? 'bg-blue-500' : 'bg-zinc-600'
                )} />
                <span className="truncate text-zinc-200">{activeIteracao.nome}</span>
              </>
            ) : (
              <span className="text-zinc-500">Selecionar iteração</span>
            )}
            <ChevronDown className="w-3 h-3 shrink-0 text-zinc-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-zinc-900 border-zinc-800">
          <DropdownMenuLabel className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Iterações do Projeto
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          {iteracoes.map(iter => (
            <DropdownMenuItem
              key={iter.id}
              className="gap-2 text-xs cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              onClick={() => handleActivate(iter.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  iter.status === 'ativa' ? 'bg-emerald-500' :
                  iter.status === 'concluida' ? 'bg-blue-500' : 'bg-zinc-600'
                )} />
                <span className="truncate text-zinc-300">{iter.nome}</span>
              </div>
              {iter.status === 'ativa' && (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem
            className="gap-2 text-xs cursor-pointer text-indigo-400 hover:bg-zinc-800 focus:bg-zinc-800 focus:text-indigo-400"
            onClick={() => setShowNewIteracao(true)}
          >
            <div className="w-3.5 h-3.5 rounded gradient-primary flex items-center justify-center shrink-0">
              <Plus className="w-2 h-2 text-white" />
            </div>
            Nova iteração
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status indicators */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-medium">Supabase</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-medium">Gemini</span>
        </div>
      </div>

      {/* Notification bell */}
      <button className="relative flex items-center justify-center w-7 h-7 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
        <Bell className="w-3.5 h-3.5" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
      </button>

      {/* New Iteration Dialog */}
      <Dialog open={showNewIteracao} onOpenChange={setShowNewIteracao}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Nova Iteração</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Crie uma nova iteração para organizar o trabalho do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Nome da Iteração *
              </label>
              <Input
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                placeholder="Ex: Iteração 3 — Checkout"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Módulo / Foco
              </label>
              <BlockNoteField
                value={newModulo}
                onChange={setNewModulo}
                placeholder="Descreva o módulo ou funcionalidade principal desta iteração"
                variant="compact"
                minHeight="72px"
                className="mt-1.5 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewIteracao(false)}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newNome.trim() || createIteration.isPending}
              className="gradient-primary border-0 text-white hover:opacity-90"
            >
              {createIteration.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : 'Criar Iteração'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}

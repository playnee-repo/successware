import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertTriangle, ChevronRight,
  LayoutGrid, FileCode, Bot, Settings2, Sliders, Cpu, Hash, GripVertical,
  Play, Loader2,
} from 'lucide-react'
import { cn, collapseBlankLines } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import {
  useAllAtividades,
  useCreateAtividade,
  useUpdateAtividade,
  useDeleteAtividade,
  useRenameDisciplina,
} from '@/features/manage-admin/model/useAdminAtividades'
import {
  useAllDefinicoesComAtividade,
  useCreateDefinicao,
  useUpdateDefinicao,
  useDeleteDefinicao,
  type DefinicaoComAtividade,
} from '@/features/manage-admin/model/useAdminDefinicoes'
import {
  useAllAgentes,
  useCreateAgente,
  useUpdateAgente,
  useRenameAgente,
} from '@/features/manage-admin/model/useAdminAgentes'
import type { AgenteConfig } from '@/entities/admin/model/types'
import type { Database } from '@/shared/api/supabase'
import { genAI } from '@/shared/config/gemini'
import { DEFINICOES_TEMPLATES } from '@/shared/config/definicoes-templates'
import { getAgenteColor } from '@/shared/lib/agent-colors'

type AtividadeRow = Database['public']['Tables']['atividades']['Row']
type DisciplinaDB = AtividadeRow['disciplina']
type Disciplina = string
type Secao = 'atividades' | 'definicoes' | 'agentes'

const DISCIPLINAS: string[] = ['descoberta', 'requisitos', 'arquitetura', 'construcao', 'qualidade']

function getDisciplinaLabel(d: string): string {
  const map: Record<string, string> = {
    descoberta: 'Descoberta', requisitos: 'Eng. Requisitos', arquitetura: 'Arquitetura',
    construcao: 'Construção', qualidade: 'Qualidade',
  }
  return map[d] ?? d.charAt(0).toUpperCase() + d.slice(1)
}

// Discipline color tokens
const DISCIPLINA_COLOR_MAP: Record<string, { text: string; dot: string; bg: string; border: string; accent: string }> = {
  descoberta:  { text: 'text-violet-400',  dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  accent: 'card-accent-violet'  },
  requisitos:  { text: 'text-indigo-400',  dot: 'bg-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  accent: 'card-accent-indigo'  },
  arquitetura: { text: 'text-blue-400',    dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    accent: 'card-accent-blue'    },
  construcao:  { text: 'text-orange-400',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  accent: 'card-accent-orange'  },
  qualidade:   { text: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', accent: 'card-accent-emerald' },
}
const DISC_FALLBACK = { text: 'text-zinc-400', dot: 'bg-zinc-500', bg: 'bg-zinc-700/30', border: 'border-zinc-700', accent: '' }
function getDisciplinaColor(d: string) { return DISCIPLINA_COLOR_MAP[d] ?? DISC_FALLBACK }

const KNOWN_VARS = ['projeto_nome', 'iteracao_modulo', 'contexto']

// ─── Shared Toast ───────────────────────────────────────────────────────────

function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const div = document.createElement('div')
  div.textContent = msg
  div.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;
    color:#fff;background:${type === 'ok' ? '#4f46e5' : '#dc2626'};
    box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none;
  `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 3000)
}

// ─── Skeleton loading rows ───────────────────────────────────────────────────

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-zinc-800/50 animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  )
}

// ─── Textarea with stats header ──────────────────────────────────────────────

function TextareaWithStats({
  label,
  value,
  onChange,
  placeholder,
  className,
  spellCheck,
  minHeight = 'min-h-32',
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  spellCheck?: boolean
  minHeight?: string
}) {
  const lines = value ? value.split('\n').length : 0
  const chars = value.length
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        {value.trim() && (
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{lines} linhas</span>
            <span className="text-zinc-700">·</span>
            <span>{chars} chars</span>
          </div>
        )}
      </div>
      <Textarea
        value={value}
        onChange={onChange}
        className={cn('bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs resize-none', minHeight, className)}
        placeholder={placeholder}
        spellCheck={spellCheck}
      />
    </div>
  )
}

// ─── Section: Atividades ─────────────────────────────────────────────────────

type AtividadeFormData = {
  nome: string
  descricao: string
  disciplina: Disciplina
  agente: string
  ordem: number
  icone: string
}

const EMPTY_ATIVIDADE: AtividadeFormData = {
  nome: '',
  descricao: '',
  disciplina: 'requisitos',
  agente: 'SCRIBE',
  ordem: 1,
  icone: '',
}

function AtividadeDialog({
  open,
  initial,
  agentes,
  onClose,
  onSave,
  allDisciplinas,
}: {
  open: boolean
  initial: (AtividadeFormData & { id?: string }) | null
  agentes: AgenteConfig[]
  onClose: () => void
  onSave: (data: AtividadeFormData & { id?: string }) => Promise<void>
  allDisciplinas: string[]
}) {
  const [form, setForm] = useState<AtividadeFormData>(initial ?? EMPTY_ATIVIDADE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(initial ?? EMPTY_ATIVIDADE)
  }, [initial, open])

  const isValid = form.nome.trim().length > 0 && form.ordem > 0
  const discColors = getDisciplinaColor(form.disciplina)
  const agentColors = getAgenteColor(form.agente)

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    try {
      await onSave({ ...form, id: initial?.id })
      onClose()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-md ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {/* Live preview badges */}
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', discColors.bg, discColors.border, discColors.text)}>
              {getDisciplinaLabel(form.disciplina)}
            </span>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold', agentColors.bg, agentColors.text)}>
              {form.agente}
            </span>
          </div>
          <DialogTitle className="text-base">
            {initial?.id ? 'Editar atividade' : 'Nova atividade'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome *</label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              placeholder="Nome da atividade"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Descrição</label>
            <BlockNoteField
              value={form.descricao}
              onChange={(val: string) => setForm((f) => ({ ...f, descricao: val }))}
              placeholder="Descrição da atividade"
              minHeight="120px"
              variant="compact"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Disciplina *</label>
              <Input
                value={form.disciplina}
                onChange={(e) => setForm((f) => ({ ...f, disciplina: e.target.value }))}
                list="disciplinas-datalist"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                placeholder="Ex: descoberta, design, devops…"
              />
              <datalist id="disciplinas-datalist">
                {allDisciplinas.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Agente *</label>
              <select
                value={form.agente}
                onChange={(e) => setForm((f) => ({ ...f, agente: e.target.value }))}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {agentes.filter((a) => a.ativo).map((a) => (
                  <option key={a.id} value={a.id}>{a.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Ordem *</label>
              <Input
                type="number"
                min={1}
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Ícone</label>
              <Input
                value={form.icone}
                onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                placeholder="FileText, BookOpen…"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  open,
  label,
  onClose,
  onConfirm,
}: {
  open: boolean
  label: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    try { await onConfirm(); onClose() }
    catch (e) { toast(`Erro: ${(e as Error).message}`, 'err') }
    finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </div>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-zinc-400 py-1">
          Excluir <strong className="text-zinc-200">{label}</strong>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button onClick={handle} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white">
            {loading ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Nova Disciplina Dialog ───────────────────────────────────────────────────

function NovaDisciplinaDialog({
  open,
  onClose,
  agentes,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  agentes: AgenteConfig[]
  onCreated: () => void
}) {
  const [discId, setDiscId] = useState('')
  const createMut = useCreateAtividade()
  const isValid = discId.trim().length > 0

  async function handle() {
    if (!isValid) return
    try {
      await createMut.mutateAsync({
        nome: 'Nova Atividade',
        disciplina: discId.trim().toLowerCase().replace(/\s+/g, '_') as DisciplinaDB,
        agente: agentes[0]?.id ?? 'SCRIBE',
        ordem: 1,
        descricao: null,
        icone: null,
      })
      toast('Disciplina criada')
      setDiscId('')
      onClose()
      onCreated()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Nova Disciplina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">ID da Disciplina *</label>
            <Input
              value={discId}
              onChange={(e) => setDiscId(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              placeholder="Ex: design, ux_research, devops…"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              O ID será usado como identificador (ex: design, ux_research)
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || createMut.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {createMut.isPending ? 'Criando…' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Editar Disciplina Dialog ─────────────────────────────────────────────────

function EditDisciplinaDialog({
  open,
  disciplina,
  onClose,
}: {
  open: boolean
  disciplina: string | null
  onClose: () => void
}) {
  const [newName, setNewName] = useState('')
  const renameMut = useRenameDisciplina()

  useEffect(() => {
    if (open) setNewName(disciplina ?? '')
  }, [open, disciplina])

  const normalised = newName.trim().toLowerCase().replace(/\s+/g, '_')
  const isValid = normalised.length > 0 && normalised !== disciplina

  async function handle() {
    if (!isValid || !disciplina) return
    try {
      await renameMut.mutateAsync({ oldName: disciplina, newName: normalised })
      toast('Disciplina renomeada')
      onClose()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Renomear disciplina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Novo ID *</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
              placeholder="Ex: design, ux_research, devops…"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Todas as atividades de <strong className="text-zinc-400">"{disciplina}"</strong> serão renomeadas para o novo ID.
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || renameMut.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {renameMut.isPending ? 'Salvando…' : 'Renomear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Nova Definição de Insumo Dialog (criar definição vinculada a uma atividade) ─

function NovaDefinicaoInsumoDialog({
  open,
  onClose,
  atividades,
  agentes,
  disciplinaLabel,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  atividades: AtividadeRow[]
  agentes: AgenteConfig[]
  disciplinaLabel: string
  onCreated?: (atividadeId: string, definicaoId: string) => void
}) {
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string>('')
  const createMut = useCreateDefinicao()

  const isValid = selectedAtividadeId.trim().length > 0 && atividades.length > 0

  async function handle() {
    if (!isValid) return
    try {
      const def = await createMut.mutateAsync({
        atividade_id: selectedAtividadeId,
        tipo_insumo: 'nova_definicao',
        agente_responsavel: agentes[0]?.id ?? 'SCRIBE',
        schema_metadado_json: null,
        prompt_template: null,
      })
      toast('Definição de insumo criada')
      setSelectedAtividadeId('')
      onClose()
      onCreated?.(selectedAtividadeId, def.id)
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  // Ao abrir, preencher primeira atividade se houver apenas uma
  useEffect(() => {
    if (open && atividades.length === 1) setSelectedAtividadeId(atividades[0].id)
    if (!open) setSelectedAtividadeId('')
  }, [open, atividades])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Nova definição de insumo</DialogTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Criar uma definição de insumo (template) para uma atividade em {disciplinaLabel}. Depois você edita tipo, schema e prompt.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {atividades.length === 0 ? (
            <p className="text-sm text-zinc-500 py-2">
              Não há atividades nesta disciplina. Crie uma atividade antes de adicionar definições de insumos.
            </p>
          ) : (
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Atividade *</label>
              <select
                value={selectedAtividadeId}
                onChange={(e) => setSelectedAtividadeId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecione a atividade</option>
                {atividades.map((atv) => (
                  <option key={atv.id} value={atv.id}>{atv.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || createMut.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {createMut.isPending ? 'Criando…' : 'Criar definição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SecaoAtividades({
  agentes,
  onOpenInsumos,
}: {
  agentes: AgenteConfig[]
  onOpenInsumos?: (atividadeId: string) => void
}) {
  const { data: atividades = [], isLoading } = useAllAtividades()
  const createMut = useCreateAtividade()
  const updateMut = useUpdateAtividade()
  const deleteMut = useDeleteAtividade()

  const [editTarget, setEditTarget] = useState<(AtividadeFormData & { id?: string }) | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AtividadeRow | null>(null)
  const [novaDisciplinaOpen, setNovaDisciplinaOpen] = useState(false)
  const [editDisciplina, setEditDisciplina] = useState<string | null>(null)

  const allDiscs = [
    ...DISCIPLINAS,
    ...Array.from(new Set(atividades.map(a => a.disciplina).filter(d => !DISCIPLINAS.includes(d)))),
  ]

  const grouped = allDiscs.reduce<Record<string, AtividadeRow[]>>((acc, d) => {
    acc[d] = atividades.filter((a) => a.disciplina === d).sort((a, b) => a.ordem - b.ordem)
    return acc
  }, {} as Record<string, AtividadeRow[]>)

  async function handleSave(data: AtividadeFormData & { id?: string }) {
    if (data.id) {
      const { id, ...rest } = data
      await updateMut.mutateAsync({ id, ...rest } as Parameters<typeof updateMut.mutateAsync>[0])
      toast('Atividade atualizada')
    } else {
      await createMut.mutateAsync({ ...data, descricao: data.descricao || null, icone: data.icone || null } as Parameters<typeof createMut.mutateAsync>[0])
      toast('Atividade criada')
    }
  }

  if (isLoading) return <SkeletonRows count={5} />

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          Cada bloco é uma <strong className="text-zinc-400">disciplina</strong>. Use <strong className="text-zinc-400">Adicionar atividade</strong> no bloco para criar; ícone de documento na linha para editar a <strong className="text-zinc-400">definição de insumo</strong> da atividade.
        </p>
        <Button
          variant="outline"
          onClick={() => setNovaDisciplinaOpen(true)}
          className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Plus className="w-4 h-4" />
          Nova disciplina
        </Button>
      </div>

      {allDiscs.map((disc) => {
        const colors = getDisciplinaColor(disc)
        return (
          <div key={disc} className="rounded-xl border border-zinc-800/80 overflow-hidden ring-inset-subtle bg-zinc-900/30">
            {/* Discipline header */}
            <div className={cn('flex items-center justify-between px-5 py-3.5', colors.bg)}>
              <div className="flex items-center gap-2.5">
                <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
                <h3 className={cn('text-xs font-semibold uppercase tracking-widest', colors.text)}>
                  {getDisciplinaLabel(disc)}
                </h3>
                <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-md border', colors.bg, colors.border, colors.text)}>
                  {grouped[disc].length} atividade{grouped[disc].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditDisciplina(disc)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                  title="Renomear disciplina"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn('h-7 text-xs px-2.5 rounded-md hover:bg-zinc-800/60', colors.text)}
                  onClick={() => setEditTarget({ ...EMPTY_ATIVIDADE, disciplina: disc, ordem: (grouped[disc].length + 1) })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar atividade
                </Button>
              </div>
            </div>

            {/* Activity rows */}
            <div className="divide-y divide-zinc-800/50">
              {grouped[disc].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-600">
                  <GripVertical className="w-6 h-6 opacity-40" />
                  <p className="text-sm italic">Nenhuma atividade nesta disciplina</p>
                </div>
              ) : (
                grouped[disc].map((atv) => {
                  const agentColors = getAgenteColor(atv.agente)
                  return (
                    <div
                      key={atv.id}
                      className={cn(
                        'flex items-center gap-4 px-5 py-3.5 bg-zinc-900/50 group card-hover',
                        colors.accent
                      )}
                    >
                      {/* Ordem badge */}
                      <span className="text-[10px] font-mono text-zinc-500 w-6 text-right shrink-0 tabular-nums">
                        {atv.ordem}
                      </span>
                      <span className="flex-1 text-sm text-zinc-200 truncate min-w-0">{atv.nome}</span>
                      <Badge className={cn('text-[10px] font-mono shrink-0 border-0', agentColors.bg, agentColors.text)}>
                        {atv.agente}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {onOpenInsumos && (
                          <button
                            onClick={() => onOpenInsumos(atv.id)}
                            className="p-2 rounded-md hover:bg-indigo-500/20 text-zinc-500 hover:text-indigo-400 transition-colors"
                            title="Ver/editar definições de insumos desta atividade"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditTarget({
                            id: atv.id,
                            nome: atv.nome,
                            descricao: atv.descricao ?? '',
                            disciplina: atv.disciplina as Disciplina,
                            agente: atv.agente,
                            ordem: atv.ordem,
                            icone: atv.icone ?? '',
                          })}
                          className="p-2 rounded-md hover:bg-zinc-700/80 text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(atv)}
                          className="p-2 rounded-md hover:bg-red-900/40 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}

      <AtividadeDialog
        open={editTarget !== null}
        initial={editTarget}
        agentes={agentes}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
        allDisciplinas={allDiscs}
      />

      <DeleteDialog
        open={deleteTarget !== null}
        label={deleteTarget?.nome ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await deleteMut.mutateAsync(deleteTarget!.id)
          toast('Atividade excluída')
        }}
      />

      <NovaDisciplinaDialog
        open={novaDisciplinaOpen}
        onClose={() => setNovaDisciplinaOpen(false)}
        agentes={agentes}
        onCreated={() => {}}
      />

      <EditDisciplinaDialog
        open={editDisciplina !== null}
        disciplina={editDisciplina}
        onClose={() => setEditDisciplina(null)}
      />

    </div>
  )
}

// ─── Section: Definições ─────────────────────────────────────────────────────

function useJsonValidation(value: string) {
  if (!value.trim()) return { valid: true, error: '' }
  try {
    JSON.parse(value)
    return { valid: true, error: '' }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

function extractTemplateVars(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

/** Normaliza schema do banco (objeto ou string) para exibição em JSON formatado */
function schemaToDisplayText(raw: DefinicaoComAtividade['schema_metadado_json']): string {
  if (raw == null) return ''
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return JSON.stringify(parsed, null, 2)
    } catch {
      return raw
    }
  }
  try {
    return JSON.stringify(raw, null, 2)
  } catch {
    return ''
  }
}

function DefinicaoEditor({
  definicao,
  agentes,
  onSaved,
  onDeleted,
}: {
  definicao: DefinicaoComAtividade
  agentes: AgenteConfig[]
  onSaved: () => void
  onDeleted: () => void
}) {
  const updateMut = useUpdateDefinicao()
  const deleteMut = useDeleteDefinicao()

  const [tipoInsumo, setTipoInsumo] = useState(definicao.tipo_insumo)
  const [agenteResp, setAgenteResp] = useState(definicao.agente_responsavel)
  const [schemaText, setSchemaText] = useState(() => schemaToDisplayText(definicao.schema_metadado_json))
  const [promptTemplate, setPromptTemplate] = useState(() => collapseBlankLines(definicao.prompt_template ?? ''))
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sincronizar estado quando a definição mudar (troca de aba ou refetch do banco)
  useEffect(() => {
    setTipoInsumo(definicao.tipo_insumo)
    setAgenteResp(definicao.agente_responsavel)
    setSchemaText(schemaToDisplayText(definicao.schema_metadado_json))
    setPromptTemplate(collapseBlankLines(definicao.prompt_template ?? ''))
  }, [
    definicao.id,
    definicao.tipo_insumo,
    definicao.agente_responsavel,
    definicao.schema_metadado_json,
    definicao.prompt_template,
  ])

  const jsonState = useJsonValidation(schemaText)

  const isDirty =
    tipoInsumo !== definicao.tipo_insumo ||
    agenteResp !== definicao.agente_responsavel ||
    schemaText !== schemaToDisplayText(definicao.schema_metadado_json) ||
    promptTemplate !== collapseBlankLines(definicao.prompt_template ?? '')

  const isValid = tipoInsumo.trim().length > 0 && jsonState.valid

  const templateVars = extractTemplateVars(promptTemplate)

  async function handleSave() {
    if (!isValid || !isDirty) return
    setSaving(true)
    try {
      let schema: Record<string, unknown> | null = null
      if (schemaText.trim()) {
        schema = JSON.parse(schemaText) as Record<string, unknown>
      }
      await updateMut.mutateAsync({
        id: definicao.id,
        tipo_insumo: tipoInsumo,
        agente_responsavel: agenteResp,
        schema_metadado_json: schema,
        prompt_template: promptTemplate || null,
      })
      toast('Definição salva')
      onSaved()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    } finally {
      setSaving(false)
    }
  }

  const agentColors = getAgenteColor(agenteResp)

  return (
    <div className="flex flex-col gap-0 h-full overflow-y-auto">
      {/* Sticky breadcrumb header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-950/95 border-b border-zinc-800/60 backdrop-blur-sm -mx-1 rounded-t-lg">
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 min-w-0">
          <span className="truncate max-w-[140px]">{definicao.atividades?.nome}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
          <span className="text-zinc-200 font-medium truncate">{definicao.tipo_insumo}</span>
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="p-2 rounded-lg hover:bg-red-900/40 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
          title="Excluir definição de insumo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 pt-2 px-1">
        {/* Usar template: preenche schema + prompt de um lugar já mapeado */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 ring-inset-subtle">
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Preencher com template (schema + prompt já prontos)</label>
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value
              if (!id) return
              const t = DEFINICOES_TEMPLATES.find((x) => x.tipo_insumo === id)
              if (t) {
                setTipoInsumo(t.tipo_insumo)
                setAgenteResp(t.agente)
                setSchemaText(JSON.stringify(t.schema_metadado_json, null, 2))
                setPromptTemplate(collapseBlankLines(t.prompt_template))
              }
              e.target.value = ''
            }}
            className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— Escolher template —</option>
            {DEFINICOES_TEMPLATES.map((t) => (
              <option key={t.tipo_insumo} value={t.tipo_insumo}>
                {t.nome} ({t.agente})
              </option>
            ))}
          </select>
        </div>

        {/* Fields section */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1">Configuração da definição de insumo</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Tipo de Insumo *</label>
              <Input
                value={tipoInsumo}
                onChange={(e) => setTipoInsumo(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Agente Responsável</label>
              <div className="flex items-center gap-2">
                <select
                  value={agenteResp}
                  onChange={(e) => setAgenteResp(e.target.value)}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {agentes.map((a) => (
                    <option key={a.id} value={a.id}>{a.id}</option>
                  ))}
                </select>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0', agentColors.bg, agentColors.text)}>
                  {agentColors.abbr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Schema JSON — kept as Textarea (raw JSON must stay monospace) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Schema JSON</label>
            <div className="flex items-center gap-2">
              {schemaText.trim() && (
                jsonState.valid
                  ? <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"><Check className="w-2.5 h-2.5" /> válido</span>
                  : <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20"><X className="w-2.5 h-2.5" /> inválido</span>
              )}
            </div>
          </div>
          <Textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs min-h-32 resize-none"
            placeholder='{ "type": "object", "properties": {} }'
            spellCheck={false}
          />
          {!jsonState.valid && schemaText.trim() && (
            <p className="text-[11px] text-red-400 mt-1 font-mono">{jsonState.error}</p>
          )}
        </div>

        {/* Prompt Template — Textarea simples (BlockNote causava centenas de linhas em branco) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Prompt Template</label>
          <Textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            placeholder="Você é {{agente}}. Projeto: {{projeto_nome}}…"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[200px] resize-y leading-relaxed"
            spellCheck={false}
          />
          {templateVars.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {templateVars.map((v) => {
                const known = KNOWN_VARS.includes(v)
                return (
                  <span
                    key={v}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border font-mono flex items-center gap-1',
                      known
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    )}
                  >
                    {!known && <AlertTriangle className="w-2.5 h-2.5" />}
                    {`{{${v}}}`}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky save/discard bar */}
      {isDirty && (
        <div className="sticky bottom-0 mt-6 -mx-1 px-6 py-4 bg-zinc-900/95 border-t border-amber-500/20 backdrop-blur-sm flex items-center justify-between rounded-b-lg">
          <p className="text-xs text-amber-400 font-medium">Alterações não salvas</p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTipoInsumo(definicao.tipo_insumo)
                setAgenteResp(definicao.agente_responsavel)
                setSchemaText(schemaToDisplayText(definicao.schema_metadado_json))
                setPromptTemplate(collapseBlankLines(definicao.prompt_template ?? ''))
              }}
              className="text-zinc-400 h-7 text-xs"
            >
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || !isDirty || saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 text-xs px-3"
              size="sm"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {!isDirty && (
        <div className="flex gap-3 pt-6 px-1">
          <Button
            onClick={handleSave}
            disabled={!isValid || !isDirty || saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            size="sm"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      )}

      <DeleteDialog
        open={deleteOpen}
        label={`definição "${definicao.tipo_insumo}"`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteMut.mutateAsync(definicao.id)
          toast('Definição de insumo excluída')
          onDeleted()
        }}
      />
    </div>
  )
}

function SecaoDefinicoes({
  agentes,
  initialAtividadeId,
  onSectionMount,
}: {
  agentes: AgenteConfig[]
  initialAtividadeId?: string | null
  onSectionMount?: () => void
}) {
  const { data: definicoes = [], isLoading } = useAllDefinicoesComAtividade()
  const { data: atividades = [] } = useAllAtividades()
  const createMut = useCreateDefinicao()

  const [selectedAtv, setSelectedAtv] = useState<string | null>(initialAtividadeId ?? null)
  const [selectedDef, setSelectedDef] = useState<string | null>(null)

  useEffect(() => {
    if (initialAtividadeId) {
      setSelectedAtv(initialAtividadeId)
      setSelectedDef(null)
      onSectionMount?.()
    }
  }, [initialAtividadeId])

  const allDiscs = [
    ...DISCIPLINAS,
    ...Array.from(new Set(atividades.map(a => a.disciplina).filter(d => !DISCIPLINAS.includes(d)))),
  ]

  const grouped = allDiscs.reduce<Record<string, typeof atividades>>((acc, d) => {
    acc[d] = atividades.filter((a) => a.disciplina === d)
    return acc
  }, {} as Record<string, typeof atividades>)

  const atvDefinicoes = definicoes.filter((d) => d.atividade_id === selectedAtv)
  const selectedDefinicao = definicoes.find((d) => d.id === selectedDef) ?? null

  useEffect(() => {
    if (selectedDef && !atvDefinicoes.find((d) => d.id === selectedDef)) {
      setSelectedDef(atvDefinicoes[0]?.id ?? null)
    }
  }, [selectedAtv])

  async function handleNewDefinicao() {
    if (!selectedAtv) return
    try {
      const def = await createMut.mutateAsync({
        atividade_id: selectedAtv,
        tipo_insumo: 'nova_definicao',
        agente_responsavel: agentes[0]?.id ?? 'SCRIBE',
        schema_metadado_json: null,
        prompt_template: null,
      })
      setSelectedDef(def.id)
      toast('Definição de insumo criada')
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  if (isLoading) return <SkeletonRows count={5} />

  return (
    <div className="flex flex-col gap-0 h-full animate-fade-in" style={{ minHeight: 0 }}>
      <p className="text-sm text-zinc-500 mb-4 shrink-0">
        Selecione uma <strong className="text-zinc-400">atividade</strong> para ver e editar sua(s) definição(ões) de insumo. Use <strong className="text-zinc-400">Nova definição</strong> para criar (apenas aqui).
      </p>
      <div className="flex gap-0 flex-1 min-h-0">
      {/* Lista: disciplinas → atividades */}
      <div className="w-64 shrink-0 border-r border-zinc-800/80 overflow-y-auto pr-5 py-1 space-y-6">
        {allDiscs.map((disc) => {
          const colors = getDisciplinaColor(disc)
          return (
            <div key={disc}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
                  {getDisciplinaLabel(disc)}
                </p>
              </div>
              <div className="space-y-1">
                {grouped[disc].map((atv) => {
                  const defs = definicoes.filter((d) => d.atividade_id === atv.id)
                  const isSelected = selectedAtv === atv.id
                  return (
                    <button
                      key={atv.id}
                      onClick={() => {
                        setSelectedAtv(atv.id)
                        setSelectedDef(defs[0]?.id ?? null)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200',
                        isSelected
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                          : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border border-transparent'
                      )}
                    >
                      <span className="truncate min-w-0">{atv.nome}</span>
                      {defs.length > 0 && (
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0',
                          isSelected ? 'bg-indigo-500/25 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                        )}>
                          {defs.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: editor */}
      <div className="flex-1 pl-8 overflow-hidden flex flex-col gap-0 min-w-0" style={{ minHeight: 0 }}>
        {!selectedAtv ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-500">
            <FileCode className="w-10 h-10 opacity-30" />
            <p className="text-sm">Selecione uma atividade na lista ao lado</p>
          </div>
        ) : (
          <>
            {/* Definição tabs */}
            <div className="flex items-center gap-2.5 mb-6 flex-wrap">
              {atvDefinicoes.map((def) => (
                <button
                  key={def.id}
                  onClick={() => setSelectedDef(def.id)}
                  className={cn(
                    'text-xs px-3.5 py-2 rounded-lg border transition-all duration-200',
                    selectedDef === def.id
                      ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                      : 'border-zinc-700/80 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  )}
                >
                  {def.tipo_insumo}
                </button>
              ))}
              <button
                onClick={handleNewDefinicao}
                className="text-xs px-3 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:border-indigo-500/50 hover:text-indigo-400 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Nova definição
              </button>
            </div>

            {selectedDefinicao ? (
              <DefinicaoEditor
                definicao={selectedDefinicao}
                agentes={agentes}
                onSaved={() => {}}
                onDeleted={() => setSelectedDef(atvDefinicoes.find((d) => d.id !== selectedDef)?.id ?? null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-zinc-500">
                <FileCode className="w-8 h-8 opacity-30" />
                <p className="text-sm">Esta atividade ainda não tem definição de insumo. Clique em <strong className="text-zinc-400">Nova definição</strong> acima.</p>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  )
}

// ─── Section: Agentes ─────────────────────────────────────────────────────────

type AgenteDraft = Omit<AgenteConfig, 'atualizado_em'>

function diffAgente(original: AgenteConfig, draft: AgenteDraft): string[] {
  const changed: string[] = []
  const keys: (keyof AgenteDraft)[] = [
    'nome', 'descricao', 'system_prompt', 'chat_system_prompt',
    'modelo', 'temperatura', 'top_k', 'top_p', 'max_output_tokens', 'ativo',
  ]
  for (const k of keys) {
    if (original[k] !== draft[k]) changed.push(k)
  }
  return changed
}

function TemperaturaBar({ value }: { value: number }) {
  // Maps 0–2 to a color from cool to warm
  const pct = Math.min(1, value / 2)
  const color = pct < 0.35 ? '#60a5fa' : pct < 0.65 ? '#818cf8' : pct < 0.85 ? '#f59e0b' : '#ef4444'
  return (
    <div className="mt-1.5 h-1 rounded-full bg-zinc-700 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct * 100}%`, backgroundColor: color }}
      />
    </div>
  )
}

function AgenteForm({
  agente,
  onSaved,
  onRenamed,
}: {
  agente: AgenteConfig
  onSaved: () => void
  onRenamed?: (newId: string) => void
}) {
  const updateMut = useUpdateAgente()
  const [draft, setDraft] = useState<AgenteDraft>({ ...agente })
  const [saving, setSaving] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  useEffect(() => { setDraft({ ...agente }) }, [agente.id])

  const changed = diffAgente(agente, draft)
  const isDirty = changed.length > 0

  const FIELD_LABEL: Record<string, string> = {
    nome: 'Nome', descricao: 'Descrição', system_prompt: 'System Prompt',
    chat_system_prompt: 'Chat System Prompt', modelo: 'Modelo',
    temperatura: 'Temperatura', top_k: 'Top K', top_p: 'Top P',
    max_output_tokens: 'Max Output Tokens', ativo: 'Ativo',
  }

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    try {
      const { id: _omit, ...rest } = draft
      await updateMut.mutateAsync({ id: agente.id, ...rest })
      toast('Agente salvo')
      onSaved()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof AgenteDraft>(key: K, val: AgenteDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }))
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full pb-6">
      {/* Card: Identity */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Identidade</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500">ID:</span>
            <span className="text-[11px] font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">{agente.id}</span>
            <button
              onClick={() => setRenameOpen(true)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60 transition-colors"
              title="Renomear ID do agente"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome</label>
            <Input value={draft.nome} onChange={(e) => set('nome', e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Modelo</label>
            <Input value={draft.modelo} onChange={(e) => set('modelo', e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Descrição</label>
          <BlockNoteField
            value={draft.descricao ?? ''}
            onChange={(val: string) => set('descricao', val || null)}
            placeholder="Descreva o papel e especialidade deste agente"
            minHeight="120px"
            variant="compact"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="ativo"
            checked={draft.ativo}
            onChange={(e) => set('ativo', e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
          />
          <label htmlFor="ativo" className="text-sm text-zinc-300">Ativo</label>
        </div>
      </div>

      {/* Card: Model parameters */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
        <div className="flex items-center gap-2.5 mb-1">
          <Sliders className="w-4 h-4 text-zinc-500" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Parâmetros do Modelo</p>
        </div>
        <div className="grid grid-cols-4 gap-5">
          <div className="col-span-1">
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Temperatura</label>
            <Input
              type="number" min={0} max={2} step={0.1}
              value={draft.temperatura}
              onChange={(e) => set('temperatura', parseFloat(e.target.value))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <TemperaturaBar value={draft.temperatura} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Top K</label>
            <Input
              type="number" min={1}
              value={draft.top_k ?? ''}
              onChange={(e) => set('top_k', e.target.value ? parseInt(e.target.value) : null)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Top P</label>
            <Input
              type="number" min={0} max={1} step={0.01}
              value={draft.top_p ?? ''}
              onChange={(e) => set('top_p', e.target.value ? parseFloat(e.target.value) : null)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Max Tokens</label>
            <Input
              type="number" min={1}
              value={draft.max_output_tokens ?? ''}
              onChange={(e) => set('max_output_tokens', e.target.value ? parseInt(e.target.value) : null)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Prompts section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Cpu className="w-4 h-4 text-zinc-500" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Prompts</p>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">System Prompt</label>
          <Textarea
            value={draft.system_prompt}
            onChange={(e) => set('system_prompt', e.target.value)}
            placeholder="Instrução de sistema principal do agente…"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[300px] resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="h-px bg-zinc-800 my-2" />

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Chat System Prompt</label>
          <Textarea
            value={draft.chat_system_prompt ?? ''}
            onChange={(e) => set('chat_system_prompt', e.target.value || null)}
            placeholder="Instrução de sistema para o chat interativo…"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-xs min-h-[200px] resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Sticky diff + save bar */}
      {isDirty && (
        <div className="sticky bottom-0 mt-6 rounded-xl border border-amber-500/25 bg-zinc-900/95 backdrop-blur-sm px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-400">Campos alterados:</p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setDraft({ ...agente })} className="text-zinc-400 h-7 text-xs">
                Descartar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 text-xs px-3"
                size="sm"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {changed.map((f) => (
              <li key={f} className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <ChevronRight className="w-2.5 h-2.5 shrink-0" /> {FIELD_LABEL[f] ?? f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isDirty && (
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            size="sm"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      )}

      <RenameAgenteDialog
        open={renameOpen}
        currentId={agente.id}
        onClose={() => setRenameOpen(false)}
        onRenamed={(newId) => { onRenamed?.(newId) }}
      />
    </div>
  )
}

// ─── Agent Playground ─────────────────────────────────────────────────────────

function AgentePlayground({ agente }: { agente: AgenteConfig }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  async function handleTest() {
    if (!input.trim() || running) return
    setRunning(true)
    setOutput('')
    try {
      const model = genAI.getGenerativeModel({
        model: agente.modelo || 'gemini-2.5-flash',
        generationConfig: {
          temperature: agente.temperatura ?? 0.7,
          topK: agente.top_k ?? 40,
          topP: agente.top_p ?? 0.95,
          maxOutputTokens: agente.max_output_tokens ?? 8192,
        },
      })
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: agente.system_prompt }] },
          { role: 'model', parts: [{ text: `Entendido. Estou pronto como ${agente.id}.` }] },
        ],
      })
      const result = await chat.sendMessage(input)
      setOutput(result.response.text())
    } catch (e) {
      setOutput(`Erro: ${(e as Error).message}`)
    } finally {
      setRunning(false)
    }
  }

  function handleClear() {
    setInput('')
    setOutput('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Info strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
          {agente.modelo || 'gemini-2.5-flash'}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
          temp: {agente.temperatura ?? 0.7}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono">
          max_tokens: {agente.max_output_tokens ?? 8192}
        </span>
      </div>

      {/* Input area */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Mensagem de teste</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-32 resize-none"
          placeholder="Digite uma mensagem para testar o agente…"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleTest}
          disabled={!input.trim() || running}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testando…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Testar
            </>
          )}
        </Button>
        {(input || output) && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Output area */}
      {output && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-3">Resposta</p>
          <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  )
}

function RenameAgenteDialog({
  open,
  currentId,
  onClose,
  onRenamed,
}: {
  open: boolean
  currentId: string | null
  onClose: () => void
  onRenamed: (newId: string) => void
}) {
  const [newId, setNewId] = useState('')
  const renameMut = useRenameAgente()

  useEffect(() => {
    if (open) setNewId(currentId ?? '')
  }, [open, currentId])

  const normalised = newId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '')
  const isValid = normalised.length > 0 && normalised !== currentId
  const previewColors = normalised ? getAgenteColor(normalised) : null

  async function handle() {
    if (!isValid || !currentId) return
    try {
      await renameMut.mutateAsync({ oldId: currentId, newId: normalised })
      toast('Agente renomeado')
      onRenamed(normalised)
      onClose()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {previewColors ? (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold', previewColors.bg, previewColors.text)}>
                {previewColors.abbr}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-zinc-500" />
              </div>
            )}
            <DialogTitle>Renomear agente</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Novo ID *</label>
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono"
              placeholder="NOVO_ID"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Atividades e definições de insumos referenciando <strong className="text-zinc-400">"{currentId}"</strong> serão atualizadas automaticamente.
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || renameMut.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {renameMut.isPending ? 'Salvando…' : 'Renomear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewAgenteDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const createMut = useCreateAgente()
  const [id, setId] = useState('')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)

  const isValid = id.trim().length > 0 && nome.trim().length > 0
  const previewColors = id.trim() ? getAgenteColor(id.trim().toUpperCase()) : null

  async function handle() {
    if (!isValid) return
    setSaving(true)
    try {
      const ag = await createMut.mutateAsync({
        id: id.trim().toUpperCase(),
        nome: nome.trim(),
        descricao: null,
        system_prompt: `Você é ${id.trim().toUpperCase()}, um agente especialista.`,
        chat_system_prompt: null,
        modelo: 'gemini-2.5-flash',
        temperatura: 0.7,
        top_k: 40,
        top_p: 0.95,
        max_output_tokens: 8192,
        ativo: true,
      })
      toast('Agente criado')
      onCreated(ag.id)
      onClose()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {previewColors ? (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold', previewColors.bg, previewColors.text)}>
                {previewColors.abbr}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-zinc-500" />
              </div>
            )}
            <DialogTitle>Novo Agente</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">ID (ex: ARCH) *</label>
            <Input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono" placeholder="MYAGENT" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome *</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="Nome de exibição" />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancelar</Button>
          <Button onClick={handle} disabled={!isValid || saving} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? 'Criando…' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type AgenteTab = 'config' | 'playground'

function SecaoAgentes() {
  const { data: agentes = [], isLoading } = useAllAgentes()
  const [selected, setSelected] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [tab, setTab] = useState<AgenteTab>('config')

  useEffect(() => {
    if (!selected && agentes.length > 0) setSelected(agentes[0].id)
  }, [agentes])

  const selectedAgente = agentes.find((a) => a.id === selected) ?? null

  if (isLoading) return <SkeletonRows count={4} />

  return (
    <div className="flex gap-0 h-full animate-fade-in" style={{ minHeight: 0 }}>
      {/* Left list */}
      <div className="w-56 shrink-0 border-r border-zinc-800/80 flex flex-col gap-1.5 pr-5 py-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Agentes</p>
          <button
            onClick={() => setNewOpen(true)}
            className="p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-indigo-400 transition-colors"
            title="Novo agente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {agentes.map((ag) => {
          const colors = getAgenteColor(ag.id)
          const isSelected = selected === ag.id
          return (
            <button
              key={ag.id}
              onClick={() => setSelected(ag.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 border',
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300'
                  : 'border-transparent text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ring-inset-subtle',
                isSelected ? colors.bg : 'bg-zinc-800',
                isSelected ? colors.text : 'text-zinc-500'
              )}>
                {colors.abbr}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono font-semibold leading-tight truncate">{ag.id}</span>
                {!ag.ativo && <span className="text-[9px] text-zinc-600 leading-tight">inativo</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Right panel */}
      <div className="flex-1 pl-8 overflow-hidden flex flex-col min-w-0" style={{ minHeight: 0 }}>
        {selectedAgente ? (
          <>
            {/* Tab bar */}
            <div className="flex gap-2 mb-6 border-b border-zinc-800/80 pb-4 shrink-0">
              {([['config', 'Configuração', Settings2], ['playground', 'Playground', Play]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
                    tab === id ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {tab === 'config' && <AgenteForm key={selectedAgente.id} agente={selectedAgente} onSaved={() => {}} onRenamed={(newId) => setSelected(newId)} />}
              {tab === 'playground' && <AgentePlayground agente={selectedAgente} />}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-56 gap-4 text-zinc-500">
            <Bot className="w-10 h-10 opacity-30" />
            <p className="text-sm">Selecione um agente</p>
          </div>
        )}
      </div>

      <NewAgenteDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => setSelected(id)}
      />
    </div>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Secao; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'atividades', label: 'Disciplinas', icon: LayoutGrid, description: 'Cada disciplina tem N atividades; cada atividade tem sua definição de insumo' },
  { id: 'definicoes', label: 'Definições de insumo', icon: FileCode, description: 'Templates por atividade (schema e prompt)' },
  { id: 'agentes',    label: 'Agentes',     icon: Bot,        description: 'Configuração dos agentes de IA' },
]

export function AdminPage() {
  const [secao, setSecao] = useState<Secao>('atividades')
  const [definicoesInitialAtividadeId, setDefinicoesInitialAtividadeId] = useState<string | null>(null)
  const { data: agentes = [] } = useAllAgentes()
  const { data: atividades = [] } = useAllAtividades()
  const { data: definicoes = [] } = useAllDefinicoesComAtividade()

  const counts: Record<Secao, number> = {
    atividades: atividades.length,
    definicoes: definicoes.length,
    agentes: agentes.length,
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === secao)!

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden bg-grid-pattern">
      {/* Left nav */}
      <div className="w-64 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950/95 backdrop-blur-sm">
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary shrink-0 ring-inset-subtle">
              <Settings2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-100 leading-tight truncate">Admin Panel</p>
              <p className="text-[11px] text-zinc-500 leading-tight">SDLC Copilot</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = secao === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSecao(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'sidebar-item-active'
                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {counts[item.id] > 0 && (
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0',
                    isActive ? 'bg-indigo-500/25 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                  )}>
                    {counts[item.id]}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Back link at bottom */}
        <div className="px-4 py-5 border-t border-zinc-800/80 mt-auto shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top header bar with breadcrumb */}
        <div className="shrink-0 px-8 lg:px-10 py-5 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 ring-inset-subtle">
            <activeNav.icon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">{activeNav.label}</h1>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5">{activeNav.description}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 max-w-[1600px] mx-auto w-full">
          {secao === 'atividades' && (
            <SecaoAtividades
              agentes={agentes}
              onOpenInsumos={(atividadeId) => {
                setDefinicoesInitialAtividadeId(atividadeId)
                setSecao('definicoes')
              }}
            />
          )}
          {secao === 'definicoes' && (
            <SecaoDefinicoes
              agentes={agentes}
              initialAtividadeId={definicoesInitialAtividadeId}
              onSectionMount={() => setDefinicoesInitialAtividadeId(null)}
            />
          )}
          {secao === 'agentes' && <SecaoAgentes />}
        </div>
      </div>
    </div>
  )
}

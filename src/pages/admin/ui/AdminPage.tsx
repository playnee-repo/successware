import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertTriangle, ChevronRight,
  LayoutGrid, FileCode, Bot, Settings2, Sliders, Cpu, Hash, GripVertical,
  Play, Loader2, Info, SlidersHorizontal, Lightbulb,
} from 'lucide-react'
import { cn, collapseBlankLines } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
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
import type { Atividade } from '@/entities/artifact/model/types'
import { getAiProvider } from '@/shared/api/container'
import { resolveModel, DEFAULT_MODEL, AVAILABLE_MODELS } from '@/shared/api/IAiProvider'
import { DEFINICOES_TEMPLATES } from '@/shared/config/definicoes-templates'
import { getAgenteColor } from '@/shared/lib/agent-colors'
import { useConfiguracoesSistema, useSetConfiguracao, CONFIG_KEYS } from '@/entities/config/model/useConfiguracoesSistema'
import { ThemeSelector } from '@/shared/ui/theme-selector'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

type AtividadeRow = Atividade
type DisciplinaDB = string
type Disciplina = string
type Secao = 'atividades' | 'definicoes' | 'agentes' | 'configuracoes'

const DISCIPLINAS: string[] = ['descoberta', 'requisitos', 'arquitetura', 'construcao', 'qualidade']

const TIPO_PROJETO_OPTIONS: { value: string; label: string }[] = [
  { value: 'startup_mvp',    label: 'Startup MVP' },
  { value: 'saas',           label: 'SaaS' },
  { value: 'app_mobile',     label: 'App Mobile' },
  { value: 'api',            label: 'API / Backend' },
  { value: 'sistema_interno', label: 'Sistema Interno' },
  { value: 'outro',          label: 'Outro' },
]

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
const DISC_FALLBACK = { text: 'text-muted-foreground', dot: 'bg-muted-foreground', bg: 'bg-muted/30', border: 'border-border', accent: '' }
function getDisciplinaColor(d: string) { return DISCIPLINA_COLOR_MAP[d] ?? DISC_FALLBACK }

const KNOWN_VARS = ['projeto_nome', 'iteracao_modulo', 'contexto', 'documentos']

// ─── Info Tooltip (ícone i com explicação) ─────────────────────────────────

function InfoTooltip({ content, className }: { content: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help shrink-0', className)}
          tabIndex={0}
        >
          <Info className="w-3.5 h-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[320px] whitespace-pre-line text-left">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Shared Toast ───────────────────────────────────────────────────────────

function toast(msg: string, type: 'ok' | 'err' = 'ok') {
  const div = document.createElement('div')
  div.setAttribute('role', 'status')
  div.setAttribute('aria-live', 'polite')
  div.textContent = msg
  const bg = type === 'ok' ? 'var(--color-primary)' : 'var(--color-destructive)'
  const fg = type === 'ok' ? 'var(--color-primary-foreground)' : 'var(--color-destructive-foreground)'
  div.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:10px 18px;border-radius:var(--radius);font-size:13px;font-weight:500;
    background:${bg};color:${fg};
    box-shadow:var(--shadow-lg);pointer-events:none;
  `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 3000)
}

// ─── Skeleton loading rows ───────────────────────────────────────────────────

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
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
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {value.trim() && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{lines} linhas</span>
            <span className="text-muted-foreground/80">·</span>
            <span>{chars} chars</span>
          </div>
        )}
      </div>
      <Textarea
        value={value}
        onChange={onChange}
        className={cn('font-mono text-xs resize-none', minHeight, className)}
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
      <DialogContent className="bg-card border-border text-foreground max-w-md ring-inset-subtle">
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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome *</label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome da atividade"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Disciplina *</label>
              <Input
                value={form.disciplina}
                onChange={(e) => setForm((f) => ({ ...f, disciplina: e.target.value }))}
                list="disciplinas-datalist"
                placeholder="Ex: descoberta, design, devops…"
              />
              <datalist id="disciplinas-datalist">
                {allDisciplinas.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agente *</label>
              <Select value={form.agente} onValueChange={(v) => setForm((f) => ({ ...f, agente: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentes.filter((a) => a.ativo).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ordem *</label>
              <Input
                type="number"
                min={1}
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ícone</label>
              <Input
                value={form.icone}
                onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                placeholder="FileText, BookOpen…"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-destructive/15 flex items-center justify-center">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </div>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-1">
          Excluir <strong className="text-foreground">{label}</strong>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button variant="destructive" onClick={handle} disabled={loading}>
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Nova Disciplina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ID da Disciplina *</label>
            <Input
              value={discId}
              onChange={(e) => setDiscId(e.target.value)}
              placeholder="Ex: design, ux_research, devops…"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              O ID será usado como identificador (ex: design, ux_research)
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || createMut.isPending}
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Renomear disciplina</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Novo ID *</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: design, ux_research, devops…"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Todas as atividades de <strong className="text-muted-foreground">"{disciplina}"</strong> serão renomeadas para o novo ID.
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || renameMut.isPending}
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

  const isValid = selectedAtividadeId.trim().length > 0 && selectedAtividadeId !== '__placeholder__' && atividades.length > 0

  async function handle() {
    if (!isValid) return
    try {
      const def = await createMut.mutateAsync({
        atividade_id: selectedAtividadeId,
        nome: 'Nova Configuração',
        tipo_insumo: 'nova_definicao',
        agente_responsavel: agentes[0]?.id ?? 'SCRIBE',
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <DialogTitle>Nova definição de insumo</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Criar uma definição de insumo (template) para uma atividade em {disciplinaLabel}. Depois você edita tipo e prompt.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {atividades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Não há atividades nesta disciplina. Crie uma atividade antes de adicionar definições de insumos.
            </p>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Atividade *</label>
              <Select value={selectedAtividadeId || '__placeholder__'} onValueChange={setSelectedAtividadeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__placeholder__">Selecione a atividade</SelectItem>
                  {atividades.map((atv) => (
                    <SelectItem key={atv.id} value={atv.id}>{atv.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || createMut.isPending}
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
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          Cada bloco é uma <strong className="text-muted-foreground">disciplina</strong>. Use <strong className="text-muted-foreground">Adicionar atividade</strong> no bloco para criar; ícone de documento na linha para editar a <strong className="text-muted-foreground">definição de insumo</strong> da atividade.
          <InfoTooltip content="Disciplinas são as abas da página do projeto (ex.: Requisitos, Arquitetura). Aqui você cria atividades dentro de cada disciplina; o ícone de documento abre as configurações de insumo (qual agente gera, prompt, etc.) para essa atividade." />
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() => setNovaDisciplinaOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova disciplina
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px]">
            Cria uma nova disciplina (ex.: design, devops). Aparece como novo bloco na página do projeto. Depois adicione atividades dentro dela.
          </TooltipContent>
        </Tooltip>
      </div>

      {allDiscs.map((disc) => {
        const colors = getDisciplinaColor(disc)
        return (
          <div key={disc} className="rounded-xl border border-border overflow-hidden ring-inset-subtle bg-card/50">
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
                  type="button"
                  onClick={() => setEditDisciplina(disc)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  title="Renomear disciplina"
                  aria-label="Renomear disciplina"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn('h-7 text-xs px-2.5 rounded-md hover:bg-muted', colors.text)}
                      onClick={() => setEditTarget({ ...EMPTY_ATIVIDADE, disciplina: disc, ordem: (grouped[disc].length + 1) })}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar atividade
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px]">
                    Cria uma nova atividade dentro desta disciplina. A atividade aparece no bloco na página do projeto; você pode editar nome, descrição e agente, e configurar definições de insumo (ícone de documento).
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Activity rows */}
            <div className="divide-y divide-border">
              {grouped[disc].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
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
                        'flex items-center gap-4 px-5 py-3.5 bg-card/50 group card-hover',
                        colors.accent
                      )}
                    >
                      {/* Ordem badge */}
                      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0 tabular-nums">
                        {atv.ordem}
                      </span>
                      <span className="flex-1 text-sm text-foreground truncate min-w-0">{atv.nome}</span>
                      <Badge className={cn('text-[10px] font-mono shrink-0 border-0', agentColors.bg, agentColors.text)}>
                        {atv.agente}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {onOpenInsumos && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onOpenInsumos(atv.id)}
                                className="p-2 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label="Ver definições de insumo"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[260px]">
                              Abre a seção Configurações de Atividade para esta atividade. Lá você define tipos de insumo (ex.: Épico, User Story), agente e prompt — usados ao criar artefatos “Texto IA” no projeto.
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditTarget({
                            id: atv.id,
                            nome: atv.nome,
                            descricao: atv.descricao ?? '',
                            disciplina: atv.disciplina as Disciplina,
                            agente: atv.agente,
                            ordem: atv.ordem,
                            icone: atv.icone ?? '',
                          })}
                          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Editar atividade"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(atv)}
                          className="p-2 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Excluir atividade"
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

function extractTemplateVars(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
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
  const [promptTemplate, setPromptTemplate] = useState(() => collapseBlankLines(definicao.prompt_template ?? ''))
  const [tiposProjeto, setTiposProjeto] = useState<string[]>(definicao.tipos_projeto ?? [])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templateSelectValue, setTemplateSelectValue] = useState('__none__')

  // Sincronizar estado quando a definição mudar (troca de aba ou refetch do banco)
  useEffect(() => {
    setTipoInsumo(definicao.tipo_insumo)
    setAgenteResp(definicao.agente_responsavel)
    setPromptTemplate(collapseBlankLines(definicao.prompt_template ?? ''))
    setTiposProjeto(definicao.tipos_projeto ?? [])
    setTemplateSelectValue('__none__')
  }, [
    definicao.id,
    definicao.tipo_insumo,
    definicao.agente_responsavel,
    definicao.prompt_template,
    definicao.tipos_projeto,
  ])

  const tiposProjetoChanged =
    JSON.stringify([...(tiposProjeto)].sort()) !==
    JSON.stringify([...(definicao.tipos_projeto ?? [])].sort())

  const isDirty =
    tipoInsumo !== definicao.tipo_insumo ||
    agenteResp !== definicao.agente_responsavel ||
    promptTemplate !== collapseBlankLines(definicao.prompt_template ?? '') ||
    tiposProjetoChanged

  const isValid = tipoInsumo.trim().length > 0

  const templateVars = extractTemplateVars(promptTemplate)

  async function handleSave() {
    if (!isValid || !isDirty) return
    setSaving(true)
    try {
      await updateMut.mutateAsync({
        id: definicao.id,
        tipo_insumo: tipoInsumo,
        agente_responsavel: agenteResp,
        prompt_template: promptTemplate || null,
        tipos_projeto: tiposProjeto.length > 0 ? tiposProjeto : null,
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
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/95 border-b border-border backdrop-blur-sm -mx-1 rounded-t-lg">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground min-w-0">
          <span className="truncate max-w-[140px]">{definicao.atividades?.nome}</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span className="text-foreground font-medium truncate">{definicao.tipo_insumo}</span>
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title="Excluir definição de insumo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 pt-2 px-1">
        {/* Usar template: preenche prompt de um lugar já mapeado */}
        <div className="rounded-xl border border-border bg-card/50 p-4 ring-inset-subtle">
          <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Preencher com template (prompt já pronto)
            <InfoTooltip content="Para que serve: Aplicar um modelo pronto (ex.: Épico, User Story) que já traz o prompt preenchido.\n\nOnde aparece: Só aqui no admin; depois de aplicar, você pode ajustar e salvar." />
          </label>
          <Select
            value={templateSelectValue}
            onValueChange={(id) => {
              setTemplateSelectValue(id)
              if (id === '__none__') return
              const t = DEFINICOES_TEMPLATES.find((x) => x.tipo_insumo === id)
              if (t) {
                setTipoInsumo(t.tipo_insumo)
                setAgenteResp(t.agente)
                setPromptTemplate(collapseBlankLines(t.prompt_template))
                setTemplateSelectValue('__none__')
              }
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="— Escolher template —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Escolher template —</SelectItem>
              {DEFINICOES_TEMPLATES.map((t) => (
                <SelectItem key={t.tipo_insumo} value={t.tipo_insumo}>
                  {t.nome} ({t.agente})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fields section */}
        <div className="rounded-xl border border-border bg-card/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1 flex items-center gap-2">
            Configuração da definição de insumo
            <InfoTooltip content="Tipo de Insumo: Nome do artefato (ex.: Épico, User Story). Aparece no diálogo “Novo artefato” como opção de agente/configuração.\n\nAgente Responsável: Qual agente de IA gera esse tipo; usa o system prompt configurado na seção Agentes." />
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">Tipo de Insumo *</label>
              <Input
                value={tipoInsumo}
                onChange={(e) => setTipoInsumo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">Agente Responsável</label>
              <div className="flex items-center gap-2">
                <Select value={agenteResp} onValueChange={setAgenteResp}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agentes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0', agentColors.bg, agentColors.text)}>
                  {agentColors.abbr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Projeto */}
        <div className="rounded-xl border border-border bg-card/50 p-5 ring-inset-subtle space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Visibilidade por Tipo de Projeto
            </p>
            <InfoTooltip content="Restringe esta configuração a tipos específicos de projeto. Quando nenhum tipo é selecionado, a configuração aparece para TODOS os projetos independente do tipo." />
          </div>
          <div className="flex flex-wrap gap-2">
            {TIPO_PROJETO_OPTIONS.map((opt) => {
              const active = tiposProjeto.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setTiposProjeto(prev =>
                      prev.includes(opt.value)
                        ? prev.filter(t => t !== opt.value)
                        : [...prev, opt.value],
                    )
                  }
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                    active
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {active && <Check className="w-3 h-3" />}
                  {opt.label}
                </button>
              )
            })}
          </div>
          {tiposProjeto.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/60">
              Nenhum tipo selecionado — aparece para <strong>todos os projetos</strong>.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">
              Restrito a {tiposProjeto.length} tipo{tiposProjeto.length > 1 ? 's' : ''}.{' '}
              <button
                type="button"
                className="underline hover:text-muted-foreground transition-colors"
                onClick={() => setTiposProjeto([])}
              >
                Limpar seleção
              </button>
            </p>
          )}
        </div>

        {/* Prompt Template — Textarea simples (BlockNote causava centenas de linhas em branco) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            Prompt Template
            <InfoTooltip content="Para que serve: O texto enviado à IA ao gerar o artefato. Use {{projeto_nome}}, {{iteracao_modulo}}, {{contexto}} para inserir dados do projeto, documentos e artefatos aprovados. Use {{documentos}} para injetar apenas os documentos do projeto separadamente.\n\nOnde aparece: Usado na geração “Texto IA” quando o usuário escolhe esta configuração ao criar um artefato." />
          </label>
          <Textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            placeholder="Você é {{agente}}. Projeto: {{projeto_nome}}…"
            className="font-mono text-xs min-h-[200px] resize-y leading-relaxed"
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
                        ? 'bg-primary/10 border-primary/30 text-primary'
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
        <div className="sticky bottom-0 mt-6 -mx-1 px-6 py-4 bg-card/95 border-t border-amber-500/20 backdrop-blur-sm flex items-center justify-between rounded-b-lg">
          <p className="text-xs text-amber-400 font-medium">Alterações não salvas</p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTipoInsumo(definicao.tipo_insumo)
                setAgenteResp(definicao.agente_responsavel)
                setPromptTemplate(collapseBlankLines(definicao.prompt_template ?? ''))
                setTiposProjeto(definicao.tipos_projeto ?? [])
                setTemplateSelectValue('__none__')
              }}
              className="text-muted-foreground h-7 text-xs"
            >
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || !isDirty || saving}
              className="h-7 text-xs px-3"
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
        nome: 'Nova Configuração',
        tipo_insumo: 'nova_definicao',
        agente_responsavel: agentes[0]?.id ?? 'SCRIBE',
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
      <p className="text-sm text-muted-foreground mb-4 shrink-0 flex items-start gap-2">
        Selecione uma <strong className="text-muted-foreground">atividade</strong> para ver e editar sua(s) definição(ões) de insumo. Use <strong className="text-muted-foreground">Nova definição</strong> para criar (apenas aqui).
        <InfoTooltip content="Cada definição de insumo é um “tipo” de artefato que a atividade pode gerar (ex.: Épico, User Story). Aqui você configura agente e prompt. No projeto, ao criar “Texto IA”, o usuário escolhe qual definição usar; essa configuração alimenta a geração." />
      </p>
      <div className="flex gap-0 flex-1 min-h-0">
      {/* Lista: disciplinas → atividades */}
      <div className="w-64 shrink-0 border-r border-border overflow-y-auto pr-5 py-1 space-y-6">
        {allDiscs.map((disc) => {
          const colors = getDisciplinaColor(disc)
          return (
            <div key={disc}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
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
                          ? 'bg-primary/15 text-primary border border-primary/25'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                      )}
                    >
                      <span className="truncate min-w-0">{atv.nome}</span>
                      {defs.length > 0 && (
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0',
                          isSelected ? 'bg-primary/25 text-primary' : 'bg-muted text-muted-foreground'
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
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
            <FileCode className="w-10 h-10 opacity-30" />
            <p className="text-sm flex items-center gap-2">Selecione uma atividade na lista ao lado <InfoTooltip content="Cada atividade pode ter várias definições de insumo (tipos de artefato). Selecione uma atividade para ver e editar as definições ou criar novas." /></p>
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
                      ? 'bg-primary/20 border-primary/30 text-primary'
                      : 'border-border text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {def.tipo_insumo}
                </button>
              ))}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNewDefinicao}
                    className="text-xs px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nova definição
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px]">
                  Cria uma nova configuração de insumo para esta atividade. Depois preencha tipo (ex.: Épico), agente e prompt template. Cada definição aparece como opção ao criar artefato “Texto IA” no projeto.
                </TooltipContent>
              </Tooltip>
            </div>

            {selectedDefinicao ? (
              <DefinicaoEditor
                definicao={selectedDefinicao}
                agentes={agentes}
                onSaved={() => {}}
                onDeleted={() => setSelectedDef(atvDefinicoes.find((d) => d.id !== selectedDef)?.id ?? null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground">
                <FileCode className="w-8 h-8 opacity-30" />
                <p className="text-sm flex items-center gap-2 text-center">
                  Esta atividade ainda não tem definição de insumo. Clique em <strong className="text-muted-foreground">Nova definição</strong> acima.
                  <InfoTooltip content="Uma definição de insumo define um tipo de artefato (ex.: Épico) com agente e prompt. Sem definições, o usuário não consegue criar artefatos “Texto IA” para esta atividade." />
                </p>
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
    <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
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
      <div className="rounded-xl border border-border bg-card/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-2">
            Identidade
            <InfoTooltip content="ID: usado nas atividades e definições de insumo para indicar qual agente gera cada artefato. Nome e descrição são exibidos no admin; modelo define qual LLM usar na geração." />
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">ID:</span>
            <span className="text-[11px] font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">{agente.id}</span>
            <button
              onClick={() => setRenameOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Renomear ID do agente"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
            <Input value={draft.nome} onChange={(e) => set('nome', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Modelo</label>
            <Select value={resolveModel(draft.modelo)} onValueChange={(v) => set('modelo', v)}>
              <SelectTrigger className="font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-mono text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
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
            className="rounded border-input bg-background accent-primary"
          />
          <label htmlFor="ativo" className="text-sm text-foreground flex items-center gap-1.5">
            Ativo
            <InfoTooltip content="Agentes inativos não aparecem nas listas de seleção (atividades e definições de insumo). Use para desativar um agente sem excluir a configuração." />
          </label>
        </div>
      </div>

      {/* Card: Model parameters */}
      <div className="rounded-xl border border-border bg-card/50 p-6 sm:p-7 space-y-5 ring-inset-subtle">
        <div className="flex items-center gap-2.5 mb-1">
          <Sliders className="w-4 h-4 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-2">
            Parâmetros do Modelo
            <InfoTooltip content="Temperatura, Top P e Max Tokens são passados à API do provedor de IA na geração de artefatos e no chat. Valores altos de temperatura deixam as respostas mais variadas." />
          </p>
        </div>
        <div className="grid grid-cols-4 gap-5">
          <div className="col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Temperatura</label>
            <Input
              type="number" min={0} max={2} step={0.1}
              value={draft.temperatura}
              onChange={(e) => set('temperatura', parseFloat(e.target.value))}
            />
            <TemperaturaBar value={draft.temperatura} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Top K</label>
            <Input
              type="number" min={1}
              value={draft.top_k ?? ''}
              onChange={(e) => set('top_k', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Top P</label>
            <Input
              type="number" min={0} max={1} step={0.01}
              value={draft.top_p ?? ''}
              onChange={(e) => set('top_p', e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Tokens</label>
            <Input
              type="number" min={1}
              value={draft.max_output_tokens ?? ''}
              onChange={(e) => set('max_output_tokens', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>
      </div>

      {/* Prompts section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-2">
            Prompts
            <InfoTooltip content="System Prompt: enviado à IA ao gerar artefatos “Texto IA” no projeto.\n\nChat System Prompt: usado no chat ao lado da página de resultado, para conversar com o agente sobre o artefato." />
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            System Prompt
            <InfoTooltip content="Instrução de sistema principal. Enviado junto ao prompt da definição de insumo quando o usuário gera um artefato com este agente. Define o “persona” e regras da IA." />
          </label>
          <Textarea
            value={draft.system_prompt}
            onChange={(e) => set('system_prompt', e.target.value)}
            placeholder="Instrução de sistema principal do agente…"
            className="font-mono text-xs min-h-[300px] resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="h-px bg-border my-2" />

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            Chat System Prompt
            <InfoTooltip content="Usado no painel de chat ao lado da página de resultado do artefato. O usuário conversa com o agente sobre o conteúdo; este prompt define o contexto do chat." />
          </label>
          <Textarea
            value={draft.chat_system_prompt ?? ''}
            onChange={(e) => set('chat_system_prompt', e.target.value || null)}
            placeholder="Instrução de sistema para o chat interativo…"
            className="font-mono text-xs min-h-[200px] resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Sticky diff + save bar */}
      {isDirty && (
        <div className="sticky bottom-0 mt-6 rounded-xl border border-amber-500/25 bg-card/95 backdrop-blur-sm px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-400">Campos alterados:</p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setDraft({ ...agente })} className="text-muted-foreground h-7 text-xs">
                Descartar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="h-7 text-xs px-3"
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
      const aiProvider = await getAiProvider()
      const result = await aiProvider.chatComplete(agente.system_prompt, [], input, agente)
      setOutput(result)
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
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
          {resolveModel(agente.modelo)}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
          temp: {agente.temperatura ?? 0.7}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
          max_tokens: {agente.max_output_tokens ?? 8192}
        </span>
      </div>

      {/* Input area */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mensagem de teste</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-32 resize-none"
          placeholder="Digite uma mensagem para testar o agente…"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleTest}
          disabled={!input.trim() || running}
          className="flex-1 flex items-center justify-center gap-2"
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
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Output area */}
      {output && (
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Resposta</p>
          <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">{output}</pre>
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {previewColors ? (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold', previewColors.bg, previewColors.text)}>
                {previewColors.abbr}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <DialogTitle>Renomear agente</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Novo ID *</label>
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              className="font-mono"
              placeholder="NOVO_ID"
              onKeyDown={(e) => { if (e.key === 'Enter') handle() }}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Atividades e definições de insumos referenciando <strong className="text-muted-foreground">"{currentId}"</strong> serão atualizadas automaticamente.
            </p>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handle}
            disabled={!isValid || renameMut.isPending}
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
        modelo: DEFAULT_MODEL,
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
      <DialogContent className="bg-card border-border text-foreground max-w-sm ring-inset-subtle">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {previewColors ? (
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold', previewColors.bg, previewColors.text)}>
                {previewColors.abbr}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <DialogTitle>Novo Agente</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ID (ex: ARCH) *</label>
            <Input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} className="font-mono" placeholder="MYAGENT" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome *</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome de exibição" />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handle} disabled={!isValid || saving}>
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
      <div className="w-56 shrink-0 border-r border-border flex flex-col gap-1.5 pr-5 py-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
            Agentes
            <InfoTooltip content="Cada agente é uma “persona” de IA (ex.: SCRIBE, ARCH). Aqui você configura modelo, temperatura, system prompt e prompt de chat. Agentes inativos não aparecem nas listas de seleção ao criar atividades ou definições de insumo." />
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setNewOpen(true)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                aria-label="Novo agente"
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Cria um novo agente (ex.: ARCH, FORGE). Depois configure nome, modelo e prompts. O agente passa a aparecer nas atividades e nas definições de insumo.</TooltipContent>
          </Tooltip>
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
                  ? 'bg-primary/15 border-primary/25 text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ring-inset-subtle',
                isSelected ? colors.bg : 'bg-muted',
                isSelected ? colors.text : 'text-muted-foreground'
              )}>
                {colors.abbr}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-mono font-semibold leading-tight truncate">{ag.id}</span>
                {!ag.ativo && <span className="text-[9px] text-muted-foreground leading-tight">inativo</span>}
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
            <div className="flex gap-2 mb-6 border-b border-border pb-4 shrink-0">
              {([['config', 'Configuração', Settings2, 'Editar nome, modelo, temperatura, system prompt e chat prompt do agente.'], ['playground', 'Playground', Play, 'Testar o agente com uma mensagem antes de usar no projeto.']] as const).map(([id, label, Icon, tip]) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTab(id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
                        tab === id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{tip}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {tab === 'config' && <AgenteForm key={selectedAgente.id} agente={selectedAgente} onSaved={() => {}} onRenamed={(newId) => setSelected(newId)} />}
              {tab === 'playground' && <AgentePlayground agente={selectedAgente} />}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-56 gap-4 text-muted-foreground">
            <Bot className="w-10 h-10 opacity-30" />
            <p className="text-sm flex items-center gap-2">Selecione um agente <InfoTooltip content="Escolha um agente na lista à esquerda para editar configuração (modelo, prompts) ou testar no Playground." /></p>
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

// ─── Toggle Switch ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        checked ? 'gradient-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Seção: Configurações ─────────────────────────────────────────────────────

function SecaoConfiguracoes() {
  const { data: config, isLoading } = useConfiguracoesSistema()
  const { mutate: setConfiguracao, isPending } = useSetConfiguracao()

  function handleAdvisorToggle(value: boolean) {
    setConfiguracao(
      { chave: CONFIG_KEYS.ADVISOR_ENABLED, valor: value },
      {
        onSuccess: () => toast(value ? 'ADVISOR habilitado' : 'ADVISOR desabilitado'),
        onError: (err) => toast(err instanceof Error ? err.message : 'Erro ao salvar configuração', 'err'),
      },
    )
  }

  const advisorEnabled = config?.advisor_enabled ?? true

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Funcionalidades</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Habilite ou desabilite recursos da interface. As configurações são salvas por empresa.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {/* ADVISOR row */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0 ring-inset-subtle">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">ADVISOR</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Widget flutuante que analisa o projeto com IA e sugere a próxima ação de maior impacto. Aparece na página do projeto.
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <Toggle
                  checked={advisorEnabled}
                  onChange={handleAdvisorToggle}
                  disabled={isPending}
                />
              )}
            </div>
            {advisorEnabled && (
              <div className="flex items-center gap-4 pl-[3.25rem]">
                <label htmlFor="advisor-cooldown" className="text-xs text-muted-foreground shrink-0">
                  Intervalo mínimo entre análises automáticas:
                </label>
                <select
                  id="advisor-cooldown"
                  value={config?.advisor_cooldown_minutes ?? 5}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (Number.isFinite(v) && v >= 1 && v <= 60) {
                      setConfiguracao(
                        { chave: CONFIG_KEYS.ADVISOR_COOLDOWN_MINUTES, valor: v },
                        {
                          onSuccess: () => toast(`Intervalo definido em ${v} min`),
                          onError: (err) => toast(err instanceof Error ? err.message : 'Erro ao salvar', 'err'),
                        },
                      )
                    }
                  }}
                  disabled={isLoading || isPending}
                  className="h-8 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[1, 2, 3, 5, 10, 15, 30, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? 'minuto' : 'minutos'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Secao; label: string; icon: React.ElementType; description: string; tooltip: string }[] = [
  {
    id: 'atividades',
    label: 'Disciplinas',
    icon: LayoutGrid,
    description: 'Cada disciplina tem N atividades; cada atividade tem sua definição de insumo',
    tooltip: 'Para que serve: Organizar o fluxo de trabalho por etapa do SDLC (ex.: Requisitos, Arquitetura). Cada disciplina agrupa atividades; cada atividade pode gerar artefatos (texto IA ou link).\n\nOnde aparece: Na página do projeto, na sidebar por disciplina; cada bloco lista as atividades e os artefatos aprovados.',
  },
  {
    id: 'definicoes',
    label: 'Configurações de Atividade',
    icon: FileCode,
    description: 'Templates por atividade (prompt)',
    tooltip: 'Para que serve: Definir para cada atividade quais “tipos de insumo” existem (ex.: Épico, User Story), qual agente gera cada um e o prompt template usado na geração com IA.\n\nOnde aparece: Ao criar um artefato “Texto IA”, o usuário escolhe o agente/configuração; o prompt e o contexto vêm daqui.',
  },
  {
    id: 'agentes',
    label: 'Agentes',
    icon: Bot,
    description: 'Configuração dos agentes de IA',
    tooltip: 'Para que serve: Configurar cada agente de IA (SCRIBE, ARCH, etc.): nome, modelo, temperatura, system prompt e prompt de chat. O Playground permite testar o agente antes de usar no projeto.\n\nOnde aparece: Os agentes são usados ao gerar artefatos (Texto IA) e no chat ao lado da página de resultado.',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: SlidersHorizontal,
    description: 'Funcionalidades e preferências do sistema',
    tooltip: 'Habilite ou desabilite funcionalidades da interface, como o ADVISOR de IA.',
  },
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
    configuracoes: 0,
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === secao)!

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden bg-grid-pattern">
      {/* Left nav */}
      <aside className="w-64 shrink-0 border-r border-sidebar-border flex flex-col bg-sidebar backdrop-blur-sm">
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary shrink-0 ring-inset-subtle">
              <Settings2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Admin Panel</p>
              <p className="text-[11px] text-muted-foreground leading-tight">SDLC Copilot</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = secao === item.id
            return (
              <div key={item.id} className="flex items-center gap-1 w-full">
                <button
                  onClick={() => setSecao(item.id)}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-w-0',
                    isActive
                      ? 'sidebar-item-active'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {counts[item.id] > 0 && (
                    <span className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0',
                      isActive ? 'bg-primary/25 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {counts[item.id]}
                    </span>
                  )}
                </button>
                <span className="shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                  <InfoTooltip content={item.tooltip} />
                </span>
              </div>
            )
          })}
        </nav>

        {/* Back link at bottom */}
        <div className="px-4 py-5 border-t border-sidebar-border mt-auto shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors group py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top header bar with breadcrumb */}
        <header className="shrink-0 px-8 lg:px-10 py-5 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 ring-inset-subtle">
              <activeNav.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-foreground leading-tight">{activeNav.label}</h1>
                <InfoTooltip content={activeNav.tooltip} />
              </div>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{activeNav.description}</p>
            </div>
          </div>
          <ThemeSelector className="shrink-0" />
        </header>

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
          {secao === 'configuracoes' && <SecaoConfiguracoes />}
        </div>
      </div>
    </div>
  )
}

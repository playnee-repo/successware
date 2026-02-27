import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Trash2, Loader2, AlertCircle, FileText,
  Eye, EyeOff, Save,
} from 'lucide-react'
import { supabase } from '@/shared/api/supabase'
import { AppShell } from '@/widgets/app-shell/ui/AppShell'
import { Header } from '@/widgets/header/ui/Header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { BlockNoteField } from '@/shared/ui/blocknote-field'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useIterations } from '@/features/manage-iterations/model/useIterations'
import {
  useDocumentos,
  useCreateDocumento,
  useUpdateDocumento,
  useDeleteDocumento,
  type Documento,
} from '@/features/manage-documents/model/useDocumentos'
import { cn } from '@/shared/lib/utils'
import type { Project } from '@/entities/project/model/types'

function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projeto', projectId],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', projectId!)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

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

// ─── Document Editor ──────────────────────────────────────────────────────────

function DocumentoEditor({
  documento,
  projectId,
  onDeleted,
}: {
  documento: Documento
  projectId: string
  onDeleted: () => void
}) {
  const updateMut = useUpdateDocumento(projectId)
  const deleteMut = useDeleteDocumento(projectId)
  const [titulo, setTitulo] = useState(documento.titulo)
  const [conteudo, setConteudo] = useState(documento.conteudo_md)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitulo(documento.titulo)
    setConteudo(documento.conteudo_md)
  }, [documento.id, documento.titulo, documento.conteudo_md])

  const isDirty = titulo !== documento.titulo || conteudo !== documento.conteudo_md

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    try {
      await updateMut.mutateAsync({ id: documento.id, titulo, conteudo_md: conteudo })
      toast('Documento salvo')
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo() {
    try {
      await updateMut.mutateAsync({ id: documento.id, ativo: !documento.ativo })
      toast(documento.ativo ? 'Documento desativado' : 'Documento ativado')
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync(documento.id)
      toast('Documento excluído')
      onDeleted()
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar — sticky no topo */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-6 py-3 border-b border-border/60 shrink-0 bg-card/95 backdrop-blur-sm">
        {!documento.ativo && (
          <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium mr-1">
            Inativo — não injeta no prompt
          </span>
        )}

        <div className="flex-1" />

        {/* Toggle ativo */}
        <button
          onClick={handleToggleAtivo}
          disabled={updateMut.isPending}
          title={documento.ativo ? 'Desativar (remover do contexto de IA)' : 'Ativar (incluir no contexto de IA)'}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
            documento.ativo
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-muted-foreground hover:bg-accent'
          )}
        >
          {documento.ativo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {documento.ativo ? 'Ativo' : 'Inativo'}
        </button>

        {/* Excluir */}
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Confirmar?</span>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-500 text-white border-0"
            >
              {deleteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Excluir'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-2.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Excluir documento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Salvar */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={cn(
            'h-7 px-3 text-xs gap-1.5 border-0 text-white transition-opacity',
            isDirty
              ? 'gradient-primary shadow-sm shadow-primary/20 hover:opacity-90'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>

      {/* Conteúdo com scroll via ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-5 max-w-3xl">
          {/* Título */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Título
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="text-base font-semibold"
              placeholder="Ex: Visão do Produto, Glossário, Restrições Técnicas…"
            />
          </div>

          {/* Conteúdo markdown */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Conteúdo (Markdown)
            </label>
            <BlockNoteField
              value={conteudo}
              onChange={setConteudo}
              minHeight="480px"
              placeholder="Descreva o contexto do projeto. Este conteúdo será enviado a todos os agentes de IA ao gerar artefatos."
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DocumentosPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { data: projeto, isLoading: projectLoading } = useProject(projectId)
  const { data: iteracoes = [] } = useIterations(projectId)
  const { data: documentos = [], isLoading: docsLoading } = useDocumentos(projectId)
  const createMut = useCreateDocumento(projectId!)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeIteracao = iteracoes.find(i => i.status === 'ativa') ?? iteracoes[0] ?? null

  useEffect(() => {
    if (!selectedId && documentos.length > 0) {
      setSelectedId(documentos[0].id)
    }
  }, [documentos, selectedId])

  const selectedDoc = documentos.find(d => d.id === selectedId) ?? null

  async function handleCreate() {
    try {
      const doc = await createMut.mutateAsync({
        titulo: 'Novo Documento',
        conteudo_md: '',
        ordem: documentos.length,
        ativo: true,
      })
      setSelectedId(doc.id)
      toast('Documento criado')
    } catch (e) {
      toast(`Erro: ${(e as Error).message}`, 'err')
    }
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  if (!projeto) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <AlertCircle className="w-7 h-7 text-destructive" />
        <p className="text-sm text-muted-foreground ml-2">Projeto não encontrado.</p>
      </div>
    )
  }

  return (
    <AppShell
      iteracao={activeIteracao}
      disciplina="documentos"
      progresso={0}
      chatContext={{
        projectId: projeto.id,
        projectName: projeto.nome,
        disciplina: 'documentos',
        route: 'project',
      }}
    >
      <Header
        project={projeto}
        iteracoes={iteracoes}
        activeIteracao={activeIteracao}
        disciplina="documentos"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Painel esquerdo: lista de documentos */}
        <div className="w-60 shrink-0 border-r border-border/60 flex flex-col bg-card/30">
          {/* Header da lista */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
            <div>
              <p className="text-xs font-semibold text-foreground">Documentos</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Contexto para os agentes</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={createMut.isPending}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Novo documento"
            >
              {createMut.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Lista */}
          <ScrollArea className="flex-1">
            {docsLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-11 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : documentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 gap-3 text-center">
                <FileText className="w-7 h-7 text-muted-foreground/25" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Nenhum documento</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    Clique em + para criar
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {documentos.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedId(doc.id)}
                    className={cn(
                      'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 border',
                      selectedId === doc.id
                        ? 'bg-primary/10 border-primary/25 text-primary'
                        : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <FileText className={cn(
                      'w-3.5 h-3.5 mt-0.5 shrink-0',
                      selectedId === doc.id ? 'text-primary' : 'text-muted-foreground/40'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">{doc.titulo}</p>
                      {!doc.ativo && (
                        <span className="text-[9px] text-amber-500/70 leading-none">inativo</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Voltar */}
          <div className="px-3 py-3 border-t border-border/40 shrink-0">
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              ← Voltar ao projeto
            </button>
          </div>
        </div>

        {/* Painel direito: editor */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background">
          {selectedDoc ? (
            <DocumentoEditor
              key={selectedDoc.id}
              documento={selectedDoc}
              projectId={projectId!}
              onDeleted={() => {
                const remaining = documentos.filter(d => d.id !== selectedDoc.id)
                setSelectedId(remaining[0]?.id ?? null)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                <FileText className="w-7 h-7 text-muted-foreground/25" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Selecione ou crie um documento
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                  Documentos ativos são enviados como contexto em todos os prompts de IA deste projeto.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createMut.isPending}
                className="gradient-primary border-0 text-white gap-2 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar primeiro documento
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

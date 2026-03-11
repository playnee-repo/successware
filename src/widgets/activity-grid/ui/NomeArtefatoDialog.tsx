import { useState, useEffect } from 'react'
import { Sparkles, Link, Paperclip } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import type { ArtefatoTipo, ConfiguracaoAtividade } from '@/entities/artifact/model/types'

interface ConfirmParams {
  nome: string
  tipo: ArtefatoTipo
  configuracao?: ConfiguracaoAtividade
  conteudo?: Record<string, unknown>
}

interface NomeArtefatoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (params: ConfirmParams) => void
  isExecuting: boolean
  iteracaoNome: string
  atividadeNome: string
  configuracoes: ConfiguracaoAtividade[]
}

const TIPO_OPTIONS: { value: ArtefatoTipo; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
  { value: 'texto', label: 'Texto IA', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: 'link', label: 'Link', icon: <Link className="w-3.5 h-3.5" /> },
  { value: 'documento', label: 'Em breve', icon: <Paperclip className="w-3.5 h-3.5" />, disabled: true },
]

export function NomeArtefatoDialog({
  open,
  onOpenChange,
  onConfirm,
  isExecuting,
  iteracaoNome,
  atividadeNome,
  configuracoes,
}: NomeArtefatoDialogProps) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<ArtefatoTipo>('texto')
  const [url, setUrl] = useState('')
  const [urlTitulo, setUrlTitulo] = useState('')
  const [selectedConfiguracaoId, setSelectedConfiguracaoId] = useState<string | null>(null)

  const selectedConfiguracao =
    configuracoes.length === 0
      ? null
      : configuracoes.find(c => c.id === selectedConfiguracaoId) ?? configuracoes[0]

  // Pre-fill name from first config when dialog opens
  useEffect(() => {
    if (open && !nome && configuracoes.length > 0) {
      setNome(configuracoes[0].nome ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleConfirm = () => {
    const trimmedNome = nome.trim()
    if (!trimmedNome) return

    if (tipo === 'link') {
      const trimmedUrl = url.trim()
      if (!trimmedUrl) return
      onConfirm({
        nome: trimmedNome,
        tipo: 'link',
        conteudo: {
          url: trimmedUrl,
          ...(urlTitulo.trim() ? { titulo: urlTitulo.trim() } : {}),
        },
      })
    } else {
      onConfirm({ nome: trimmedNome, tipo, configuracao: selectedConfiguracao ?? undefined })
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setNome('')
      setTipo('texto')
      setUrl('')
      setUrlTitulo('')
      setSelectedConfiguracaoId(null)
    } else if (value && configuracoes.length > 0) {
      setSelectedConfiguracaoId(configuracoes[0].id)
    }
    onOpenChange(value)
  }

  const isTextoIaDisabled = configuracoes.length === 0

  const isConfirmDisabled = () => {
    if (!nome.trim()) return true
    if (tipo === 'link' && !url.trim()) return true
    if (tipo === 'documento') return true
    if (tipo === 'texto') {
      if (isTextoIaDisabled) return true
      if (!selectedConfiguracao) return true
    }
    return isExecuting
  }

  const confirmLabel = () => {
    if (isExecuting) return 'Gerando...'
    if (tipo === 'texto') return 'Gerar com IA'
    if (tipo === 'link') return 'Adicionar Link'
    return 'Em breve'
  }

  const confirmIcon = () => {
    if (tipo === 'texto') return <Sparkles className="w-3.5 h-3.5" />
    if (tipo === 'link') return <Link className="w-3.5 h-3.5" />
    return <Paperclip className="w-3.5 h-3.5" />
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Novo Artefato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <div className="flex gap-2">
              {TIPO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled || (opt.value === 'texto' && isTextoIaDisabled)}
                  onClick={() => !(opt.disabled || (opt.value === 'texto' && isTextoIaDisabled)) && setTipo(opt.value)}
                  title={opt.value === 'texto' && isTextoIaDisabled ? 'Configure definições de insumo para esta atividade no Admin' : undefined}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    opt.disabled || (opt.value === 'texto' && isTextoIaDisabled)
                      ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                      : tipo === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
                  ].join(' ')}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            {isTextoIaDisabled && (
              <p className="text-[11px] text-muted-foreground/80">
                Para habilitar <strong className="text-muted-foreground">Texto IA</strong>, adicione definições de insumo para a atividade &quot;{atividadeNome}&quot; em <strong className="text-muted-foreground">Admin → Configurações de Atividade</strong>.
              </p>
            )}
          </div>

          {/* Seletor de agente/configuração — sempre visível para Texto IA */}
          {tipo === 'texto' && configuracoes.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Agente que gera o artefato</label>
              <div className="flex flex-col gap-1.5">
                {configuracoes.map(cfg => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => setSelectedConfiguracaoId(cfg.id)}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-md text-xs border transition-colors text-left',
                      selectedConfiguracaoId === cfg.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0',
                        selectedConfiguracaoId === cfg.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      {cfg.agente_responsavel}
                    </span>
                    <span className="font-medium truncate">{cfg.nome || cfg.tipo_insumo}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nome do artefato
            </label>
            <Input
              placeholder={`Ex: Épico — ${atividadeNome}`}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tipo !== 'link') handleConfirm()
              }}
              autoFocus
              className="text-sm"
            />
          </div>

          {/* Link fields */}
          {tipo === 'link' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  URL <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm()
                  }}
                  className="text-sm"
                  type="url"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Título (opcional)
                </label>
                <Input
                  placeholder="Título descritivo do link"
                  value={urlTitulo}
                  onChange={(e) => setUrlTitulo(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/70">
            Iteração: <span className="font-medium text-muted-foreground">{iteracaoNome}</span>
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isExecuting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirmDisabled()}
            className="gap-1.5 gradient-primary border-0 text-white hover:opacity-90"
          >
            {confirmIcon()}
            {confirmLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

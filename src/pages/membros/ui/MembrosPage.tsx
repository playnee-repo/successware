import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { Home, UserPlus, Trash2, Shield, User, Loader2, ChevronRight, Users } from 'lucide-react'
import { supabase } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/shared/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui/select'

interface Membro {
  id: string
  user_id: string
  email: string
  role: string
  criado_em: string
}

function useMembros() {
  return useQuery({
    queryKey: ['membros'],
    queryFn: async (): Promise<Membro[]> => {
      const { data, error } = await supabase.rpc('listar_membros')
      if (error) throw error
      return data as Membro[]
    },
  })
}

// Retorna 'ok' | 'not_found'
async function tentarAdicionarPorEmail(email: string, role: string): Promise<'ok' | 'not_found'> {
  const { data, error } = await supabase.rpc('adicionar_membro_por_email', {
    p_email: email,
    p_role: role,
  })
  if (error) throw new Error(error.message)
  return data as 'ok' | 'not_found'
}

async function criarContaEAdicionar(email: string, password: string, role: string) {
  const tempClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    { auth: { storageKey: 'temp-member-signup', persistSession: false } }
  )
  const { data, error } = await tempClient.auth.signUp({ email, password })
  if (error || !data.user) throw new Error(error?.message ?? 'Erro ao criar usuário')
  await tempClient.auth.signOut()

  const { error: rpcError } = await supabase.rpc('adicionar_membro', {
    p_user_id: data.user.id,
    p_role: role,
  })
  if (rpcError) throw new Error(rpcError.message)
}

function useRemoverMembro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remover_membro', { p_user_id: userId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membros'] }),
  })
}

function useAtualizarRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc('adicionar_membro', {
        p_user_id: userId,
        p_role: role,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['membros'] }),
  })
}

export function MembrosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: membros = [], isLoading } = useMembros()
  const removerMembro = useRemoverMembro()
  const atualizarRole = useAtualizarRole()
  const qc = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'membro' | 'admin'>('membro')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function resetDialog() {
    setEmail('')
    setPassword('')
    setRole('membro')
    setNeedsPassword(false)
    setFormError(null)
    setDialogOpen(false)
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setLoading(true)
    try {
      if (needsPassword) {
        // Usuário não existe — criar conta com senha fornecida
        await criarContaEAdicionar(email, password, role)
      } else {
        // Tenta pelo email primeiro
        const resultado = await tentarAdicionarPorEmail(email, role)
        if (resultado === 'not_found') {
          setNeedsPassword(true)
          setLoading(false)
          return
        }
      }
      qc.invalidateQueries({ queryKey: ['membros'] })
      resetDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao adicionar membro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Membros</span>
          </div>
          <div className="flex-1" />
          <Button
            size="sm"
            className="gap-1.5 h-7 px-2.5 text-xs gradient-primary border-0 text-white hover:opacity-90"
            onClick={() => setDialogOpen(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar membro
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Membros da equipe</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie quem tem acesso ao workspace da sua empresa.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {membros.map((membro, i) => (
              <div
                key={membro.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < membros.length - 1 ? 'border-b border-border' : ''}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Email */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{membro.email}</p>
                  {membro.user_id === user?.id && (
                    <p className="text-[10px] text-muted-foreground">Você</p>
                  )}
                </div>

                {/* Role selector */}
                <Select
                  value={membro.role}
                  onValueChange={(val) => atualizarRole.mutate({ userId: membro.user_id, role: val })}
                  disabled={membro.user_id === user?.id}
                >
                  <SelectTrigger className="h-7 w-28 text-xs border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="membro" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Membro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Remove */}
                <button
                  onClick={() => removerMembro.mutate(membro.user_id)}
                  disabled={membro.user_id === user?.id || removerMembro.isPending}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {membros.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum membro encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog — adicionar membro */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true) }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar membro</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {needsPassword
                ? 'Usuário não encontrado. Defina uma senha para criar a conta.'
                : 'Informe o email do membro. Se já tiver conta, será adicionado diretamente.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setNeedsPassword(false) }}
                placeholder="colega@email.com"
                required
                autoComplete="off"
                disabled={needsPassword}
              />
            </div>

            {needsPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha inicial</label>
                <Input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">O membro poderá trocar a senha depois.</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Papel</label>
              <Select value={role} onValueChange={(v) => setRole(v as 'membro' | 'admin')}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Membro
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetDialog}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="gradient-primary border-0 text-white hover:opacity-90"
              >
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : needsPassword ? 'Criar e adicionar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

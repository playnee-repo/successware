// src/pages/login/ui/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresaNome, setEmpresaNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        if (!empresaNome.trim()) {
          setError('Informe o nome da empresa')
          return
        }
        await signUp(email, password, empresaNome.trim())
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">SDLC Copilot</CardTitle>
          <p className="text-sm text-center text-muted-foreground mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta e empresa'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="empresa" className="text-sm font-medium">
                  Nome da Empresa
                </label>
                <Input
                  id="empresa"
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  placeholder="Minha Empresa"
                  required
                  autoComplete="organization"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? (mode === 'login' ? 'Entrando...' : 'Criando conta...')
                : (mode === 'login' ? 'Entrar' : 'Criar conta')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login'
                ? 'Não tem conta? Criar agora'
                : 'Já tem conta? Entrar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

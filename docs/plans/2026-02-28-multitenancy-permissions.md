# Multitenância e Permissões — Plano de Implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar autenticação, multitenância por empresa e controle de acesso (admin/membro) sem acoplar a UI ao Supabase, usando o padrão AuthProvider adapter.

**Architecture:** Interface `IAuthProvider` define o contrato de auth; `SupabaseAuthAdapter` implementa para hoje. `AuthContext` expõe `useAuth()` e `usePermissions()` para toda a app. Banco adiciona tabelas `empresas` + `membros_empresa`, coluna `empresa_id` nas tabelas tenant-específicas, e RLS filtra por empresa do usuário logado.

**Tech Stack:** React 19, TypeScript, Supabase (Auth + PostgreSQL), TanStack Query v5, React Router v7, ShadCN UI, FSD

---

## Visão Geral das Tarefas

1. Migration: tabelas `empresas` + `membros_empresa`
2. Migration: `empresa_id` nas tabelas existentes + RLS real
3. Atualizar tipos `Database` em `supabase.ts`
4. Criar `IAuthProvider` + tipo `AuthUser`
5. Criar `SupabaseAuthAdapter`
6. Criar `AuthContext` + `useAuth`
7. Criar `usePermissions`
8. Criar entities `user` e `empresa`
9. Criar `LoginPage`
10. Criar `ProtectedRoute` + `AdminRoute`
11. Atualizar router + providers
12. Guardar `AdminPage` com permissão
13. Migration de dados: empresa demo + seed

---

### Task 1: Migration — tabelas `empresas` e `membros_empresa`

**Files:**
- Create: `supabase/migrations/012_multitenancy_tables.sql`

**Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/012_multitenancy_tables.sql

-- Tabela de tenants (empresas)
create table if not exists empresas (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  slug      text unique not null,
  criado_em timestamptz not null default now()
);

-- Membros de cada empresa com role
create table if not exists membros_empresa (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'membro')),
  criado_em  timestamptz not null default now(),
  unique(empresa_id, user_id)
);

-- RLS para empresas: usuário vê apenas sua empresa
alter table empresas enable row level security;

create policy "tenant_empresas_select" on empresas
  for select using (
    id in (
      select empresa_id from membros_empresa
      where user_id = auth.uid()
    )
  );

-- RLS para membros_empresa: usuário vê membros da sua empresa
alter table membros_empresa enable row level security;

create policy "tenant_membros_select" on membros_empresa
  for select using (
    empresa_id in (
      select empresa_id from membros_empresa
      where user_id = auth.uid()
    )
  );

-- Admins podem inserir/deletar membros da sua empresa
create policy "tenant_membros_admin_write" on membros_empresa
  for all using (
    empresa_id in (
      select empresa_id from membros_empresa
      where user_id = auth.uid() and role = 'admin'
    )
  );
```

**Step 2: Aplicar a migration**

```bash
supabase db reset
```

Esperado: reset completo sem erros, tabelas `empresas` e `membros_empresa` criadas.

**Step 3: Verificar no Supabase Studio**

Abrir http://127.0.0.1:54323 → Table Editor → confirmar tabelas `empresas` e `membros_empresa` existem.

**Step 4: Commit**

```bash
git add supabase/migrations/012_multitenancy_tables.sql
git commit -m "feat(db): tabelas empresas e membros_empresa com RLS"
```

---

### Task 2: Migration — `empresa_id` nas tabelas existentes + função helper + RLS real

**Files:**
- Create: `supabase/migrations/013_add_empresa_id.sql`

**Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/013_add_empresa_id.sql

-- Função helper: retorna empresa_id do usuário logado
-- security definer: roda com privilégios do owner (evita recursão RLS)
create or replace function empresa_do_usuario()
returns uuid
language sql
stable
security definer
as $$
  select empresa_id
  from membros_empresa
  where user_id = auth.uid()
  limit 1
$$;

-- ── projetos ──────────────────────────────────────────────────
alter table projetos add column if not exists empresa_id uuid references empresas(id);

-- Remover política aberta
drop policy if exists "allow_all_projetos" on projetos;

-- Nova política por tenant
create policy "tenant_projetos" on projetos
  for all
  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── iteracoes ─────────────────────────────────────────────────
alter table iteracoes add column if not exists empresa_id uuid references empresas(id);

drop policy if exists "allow_all_iteracoes" on iteracoes;

create policy "tenant_iteracoes" on iteracoes
  for all
  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── artefatos ─────────────────────────────────────────────────
alter table artefatos add column if not exists empresa_id uuid references empresas(id);

drop policy if exists "allow_all_insumos" on artefatos;

create policy "tenant_artefatos" on artefatos
  for all
  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── mensagens_agente ──────────────────────────────────────────
alter table mensagens_agente add column if not exists empresa_id uuid references empresas(id);

drop policy if exists "allow_all_mensagens" on mensagens_agente;

create policy "tenant_mensagens" on mensagens_agente
  for all
  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── documentos_projeto ────────────────────────────────────────
-- documentos herdam isolamento via projeto (empresa_id via JOIN)
-- mas adicionamos empresa_id direto para RLS simples
alter table documentos_projeto add column if not exists empresa_id uuid references empresas(id);

drop policy if exists "allow_all_documentos" on documentos_projeto;

create policy "tenant_documentos" on documentos_projeto
  for all
  using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());

-- ── tabelas globais (sem restrição por tenant) ────────────────
-- atividades, configuracoes_atividade, agentes_config permanecem abertas
-- (dados globais do sistema, não pertencem a nenhum tenant)
drop policy if exists "allow_all_atividades" on atividades;
create policy "global_atividades_read" on atividades for select using (true);

drop policy if exists "allow_all_definicoes" on configuracoes_atividade;
create policy "global_configuracoes_read" on configuracoes_atividade for select using (true);
```

**Step 2: Aplicar a migration**

```bash
supabase db reset
```

Esperado: sem erros. Confirmar colunas `empresa_id` em projetos, iteracoes, artefatos, mensagens_agente, documentos_projeto via Table Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/013_add_empresa_id.sql
git commit -m "feat(db): empresa_id nas tabelas tenant-específicas + RLS real"
```

---

### Task 3: Atualizar tipos `Database` em `supabase.ts`

**Files:**
- Modify: `src/shared/api/supabase.ts`

**Step 1: Adicionar tipos das novas tabelas e colunas**

No arquivo `src/shared/api/supabase.ts`, dentro do objeto `Tables`:

1. Adicionar `empresa_id: string | null` no `Row` de `projetos`, `iteracoes`, `artefatos`, `mensagens_agente`, `documentos_projeto`.
2. Adicionar tabela `empresas`:

```typescript
empresas: {
  Row: {
    id: string
    nome: string
    slug: string
    criado_em: string
  }
  Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'criado_em'> & {
    id?: string
    criado_em?: string
  }
  Update: Partial<Database['public']['Tables']['empresas']['Insert']>
}
```

3. Adicionar tabela `membros_empresa`:

```typescript
membros_empresa: {
  Row: {
    id: string
    empresa_id: string
    user_id: string
    role: 'admin' | 'membro'
    criado_em: string
  }
  Insert: Omit<Database['public']['Tables']['membros_empresa']['Row'], 'id' | 'criado_em'> & {
    id?: string
    criado_em?: string
  }
  Update: Partial<Database['public']['Tables']['membros_empresa']['Insert']>
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 3: Commit**

```bash
git add src/shared/api/supabase.ts
git commit -m "feat(types): empresas, membros_empresa e empresa_id nas tabelas"
```

---

### Task 4: Criar `IAuthProvider` + tipo `AuthUser`

**Files:**
- Create: `src/shared/auth/IAuthProvider.ts`

**Step 1: Criar o arquivo**

```typescript
// src/shared/auth/IAuthProvider.ts

export interface AuthUser {
  id: string
  email: string
  empresaId: string
  role: 'admin' | 'membro'
}

export interface IAuthProvider {
  /** Autentica e retorna o usuário ou lança erro */
  signIn(email: string, password: string): Promise<AuthUser>
  /** Encerra a sessão */
  signOut(): Promise<void>
  /** Retorna usuário da sessão atual, ou null se não autenticado */
  getSession(): Promise<AuthUser | null>
}
```

**Nota:** `AuthUser` é o contrato público — nunca contém tipos do Supabase. Qualquer adapter futuro deve retornar exatamente esse formato.

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 3: Commit**

```bash
git add src/shared/auth/IAuthProvider.ts
git commit -m "feat(auth): interface IAuthProvider e tipo AuthUser"
```

---

### Task 5: Criar `SupabaseAuthAdapter`

**Files:**
- Create: `src/shared/auth/SupabaseAuthAdapter.ts`

**Step 1: Criar o adapter**

```typescript
// src/shared/auth/SupabaseAuthAdapter.ts
import { supabase } from '@/shared/api/supabase'
import type { AuthUser, IAuthProvider } from './IAuthProvider'

async function fetchAuthUser(userId: string, email: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('membros_empresa')
    .select('empresa_id, role')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Usuário não possui empresa associada. Contate o administrador.')
  }

  return {
    id: userId,
    email,
    empresaId: data.empresa_id,
    role: data.role as AuthUser['role'],
  }
}

export class SupabaseAuthAdapter implements IAuthProvider {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Falha na autenticação')
    }

    return fetchAuthUser(data.user.id, data.user.email ?? email)
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getSession(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return null

    try {
      return await fetchAuthUser(session.user.id, session.user.email ?? '')
    } catch {
      // Sessão Supabase existe mas sem empresa — tratar como não autenticado
      return null
    }
  }
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 3: Commit**

```bash
git add src/shared/auth/SupabaseAuthAdapter.ts
git commit -m "feat(auth): SupabaseAuthAdapter implementando IAuthProvider"
```

---

### Task 6: Criar `AuthContext` + `useAuth`

**Files:**
- Create: `src/shared/auth/AuthContext.tsx`
- Create: `src/shared/auth/useAuth.ts`

**Step 1: Criar `AuthContext.tsx`**

```tsx
// src/shared/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, IAuthProvider } from './IAuthProvider'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  provider: IAuthProvider
}

export function AuthProvider({ children, provider }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    provider.getSession().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [provider])

  async function signIn(email: string, password: string) {
    const u = await provider.signIn(email, password)
    setUser(u)
  }

  async function signOut() {
    await provider.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
```

**Step 2: Criar `useAuth.ts`**

```typescript
// src/shared/auth/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
```

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 4: Commit**

```bash
git add src/shared/auth/AuthContext.tsx src/shared/auth/useAuth.ts
git commit -m "feat(auth): AuthContext e useAuth hook"
```

---

### Task 7: Criar `usePermissions`

**Files:**
- Create: `src/shared/auth/usePermissions.ts`

**Step 1: Criar o hook**

```typescript
// src/shared/auth/usePermissions.ts
import { useAuth } from './useAuth'
import type { AuthUser } from './IAuthProvider'

export type Permission =
  | 'gerenciar_usuarios'
  | 'ver_admin'
  | 'editar_projeto'
  | 'aprovar_artefato'

const PERMISSION_MAP: Record<AuthUser['role'], Permission[]> = {
  admin: [
    'gerenciar_usuarios',
    'ver_admin',
    'editar_projeto',
    'aprovar_artefato',
  ],
  membro: ['editar_projeto', 'aprovar_artefato'],
}

export function usePermissions() {
  const { user } = useAuth()

  const role = user?.role ?? 'membro'
  const permissions = PERMISSION_MAP[role]

  return {
    isAdmin: role === 'admin',
    isMembro: role === 'membro',
    can: (action: Permission) => permissions.includes(action),
  }
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 3: Commit**

```bash
git add src/shared/auth/usePermissions.ts
git commit -m "feat(auth): usePermissions com PERMISSION_MAP por role"
```

---

### Task 8: Criar barrel export do módulo auth

**Files:**
- Create: `src/shared/auth/index.ts`

**Step 1: Criar index**

```typescript
// src/shared/auth/index.ts
export type { AuthUser, IAuthProvider } from './IAuthProvider'
export { AuthProvider } from './AuthContext'
export { useAuth } from './useAuth'
export { usePermissions } from './usePermissions'
export type { Permission } from './usePermissions'
export { SupabaseAuthAdapter } from './SupabaseAuthAdapter'
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/shared/auth/index.ts
git commit -m "feat(auth): barrel export src/shared/auth"
```

---

### Task 9: Criar `LoginPage`

**Files:**
- Create: `src/pages/login/ui/LoginPage.tsx`

**Step 1: Criar a página**

```tsx
// src/pages/login/ui/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/auth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">SDLC Copilot</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/pages/login/ui/LoginPage.tsx
git commit -m "feat(pages): LoginPage com form email/senha"
```

---

### Task 10: Criar `ProtectedRoute` + `AdminRoute`

**Files:**
- Create: `src/app/router/ProtectedRoute.tsx`

**Step 1: Criar componentes de guarda**

```tsx
// src/app/router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, usePermissions } from '@/shared/auth'
import type { Permission } from '@/shared/auth'

/** Redireciona para /login se não autenticado */
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Carregando...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

interface PermissionRouteProps {
  permission: Permission
}

/** Redireciona para / se usuário não tiver a permissão */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { user, loading } = useAuth()
  const { can } = usePermissions()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!can(permission)) return <Navigate to="/" replace />

  return <Outlet />
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/router/ProtectedRoute.tsx
git commit -m "feat(router): ProtectedRoute e PermissionRoute"
```

---

### Task 11: Atualizar router + AppProviders

**Files:**
- Modify: `src/app/router/index.tsx`
- Modify: `src/app/providers/index.tsx`

**Step 1: Atualizar `src/app/router/index.tsx`**

Substituir o conteúdo por:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard/ui/DashboardPage'
import { ProjectPage } from '@/pages/project/ui/ProjectPage'
import { ResultadoPage } from '@/pages/resultado/ui/ResultadoPage'
import { AdminPage } from '@/pages/admin/ui/AdminPage'
import { DocumentosPage } from '@/pages/documentos/ui/DocumentosPage'
import { LoginPage } from '@/pages/login/ui/LoginPage'
import { ProtectedRoute, PermissionRoute } from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    // Rotas protegidas — requer autenticação
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/project/:projectId', element: <ProjectPage /> },
      { path: '/project/:projectId/documentos', element: <DocumentosPage /> },
      { path: '/project/:projectId/:disciplina', element: <ProjectPage /> },
      {
        path: '/project/:projectId/:disciplina/resultado/:artefatoId',
        element: <ResultadoPage />,
      },
      {
        // Admin — requer role admin
        element: <PermissionRoute permission="ver_admin" />,
        children: [
          { path: '/admin', element: <AdminPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
```

**Step 2: Atualizar `src/app/providers/index.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { ThemeProvider } from '@/shared/lib/theme-provider'
import { AuthProvider, SupabaseAuthAdapter } from '@/shared/auth'
import { router } from '@/app/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const authProvider = new SupabaseAuthAdapter()

export function AppProviders() {
  return (
    <ThemeProvider>
      <AuthProvider provider={authProvider}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={300}>
            <RouterProvider router={router} />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

**Nota:** `AuthProvider` fica fora do `QueryClientProvider` intencionalmente — o estado de auth não depende de queries e deve estar disponível globalmente antes.

**Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

**Step 4: Commit**

```bash
git add src/app/router/index.tsx src/app/providers/index.tsx
git commit -m "feat(app): integrar AuthProvider e rotas protegidas no router"
```

---

### Task 12: Migration de dados — empresa demo + usuário admin

**Files:**
- Modify: `supabase/seed.sql`

**Step 1: Adicionar seed de empresa e usuário**

No início do `supabase/seed.sql`, antes dos inserts existentes, adicionar:

```sql
-- ── Empresa demo ────────────────────────────────────────────
insert into empresas (id, nome, slug)
values ('00000000-0000-0000-0000-000000000001', 'Empresa Demo', 'demo')
on conflict (slug) do nothing;

-- Usuário admin demo (criado via Supabase Auth internamente)
-- Criado com: supabase@demo.com / password123
-- O insert abaixo será feito via Supabase Auth API (ver Step 2)
```

**Step 2: Criar usuário admin via CLI após reset**

Após `supabase db reset`, rodar:

```bash
# Criar usuário no Supabase Auth local
curl -X POST http://127.0.0.1:54321/auth/v1/admin/users \
  -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env.local | cut -d= -f2)" \
  -H "Authorization: Bearer $(grep VITE_SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2 2>/dev/null || echo 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0')" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "password123", "email_confirm": true}'
```

**Alternativa mais simples — usar Supabase Studio:**
1. Abrir http://127.0.0.1:54323 → Authentication → Users
2. Clicar "Add user" → email: `admin@demo.com`, senha: `password123`
3. Copiar o UUID gerado

**Step 3: Vincular usuário à empresa no seed**

Com o UUID do usuário criado, adicionar ao `seed.sql`:

```sql
-- Substituir USER_UUID pelo UUID real gerado no passo anterior
insert into membros_empresa (empresa_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'USER_UUID_AQUI',
  'admin'
)
on conflict (empresa_id, user_id) do nothing;

-- Atualizar projetos existentes com empresa_id
update projetos set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- Atualizar iteracoes
update iteracoes set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- Atualizar artefatos
update artefatos set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- Atualizar mensagens
update mensagens_agente set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;

-- Atualizar documentos
update documentos_projeto set empresa_id = '00000000-0000-0000-0000-000000000001'
where empresa_id is null;
```

**Step 4: Aplicar e verificar**

```bash
supabase db reset
# Depois criar usuário pelo Studio e vincular manualmente via SQL Editor
```

**Step 5: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): seed empresa demo e migração de dados existentes"
```

---

### Task 13: Teste manual end-to-end

**Step 1: Iniciar o ambiente**

```bash
supabase start
npm run dev
```

**Step 2: Verificar redirecionamento para login**

Abrir http://localhost:5173 → deve redirecionar para `/login`.

**Step 3: Testar login inválido**

Inserir email/senha incorretos → deve exibir mensagem de erro abaixo do formulário.

**Step 4: Testar login válido**

Inserir `admin@demo.com` / `password123` → deve redirecionar para `/` e exibir o dashboard com os projetos da empresa demo.

**Step 5: Verificar isolamento de dados**

Criar um segundo usuário (Studio → Authentication) vinculado a uma segunda empresa → fazer login com ele → não deve ver projetos da empresa demo.

**Step 6: Verificar rota `/admin`**

- Logado como `admin` → deve acessar `/admin` normalmente.
- Logado como `membro` → deve ser redirecionado para `/`.

**Step 7: Verificar logout**

- O botão de logout (a ser adicionado no Header) chama `signOut()` → redireciona para `/login`.

**Nota:** O botão de logout no Header (`src/widgets/header/`) deve chamar `useAuth().signOut()`. Adicionar um botão simples se ainda não existir.

---

## Resumo dos arquivos criados/modificados

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/012_multitenancy_tables.sql` | Criar |
| `supabase/migrations/013_add_empresa_id.sql` | Criar |
| `src/shared/api/supabase.ts` | Modificar (tipos) |
| `src/shared/auth/IAuthProvider.ts` | Criar |
| `src/shared/auth/SupabaseAuthAdapter.ts` | Criar |
| `src/shared/auth/AuthContext.tsx` | Criar |
| `src/shared/auth/useAuth.ts` | Criar |
| `src/shared/auth/usePermissions.ts` | Criar |
| `src/shared/auth/index.ts` | Criar |
| `src/pages/login/ui/LoginPage.tsx` | Criar |
| `src/app/router/ProtectedRoute.tsx` | Criar |
| `src/app/router/index.tsx` | Modificar |
| `src/app/providers/index.tsx` | Modificar |
| `supabase/seed.sql` | Modificar |

## Como trocar o backend de auth futuramente

1. Criar `src/shared/auth/CustomBackendAdapter.ts` implementando `IAuthProvider`
2. Em `src/app/providers/index.tsx`, trocar `new SupabaseAuthAdapter()` por `new CustomBackendAdapter()`
3. Zero mudanças na UI, hooks, páginas — tudo continua funcionando

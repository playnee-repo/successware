# Design: Multitenância e Permissões

**Data:** 2026-02-28
**Status:** Aprovado

---

## Contexto

O SDLC Copilot está atualmente sem autenticação — acesso anônimo via chave pública do Supabase, sem tabela de usuários, sem isolamento de dados entre clientes. Este documento define a arquitetura para adicionar multitenância e controle de acesso sem criar acoplamento ao Supabase, permitindo trocar o backend de auth futuramente.

---

## Modelo de Negócio

- **Tenant:** Empresa (organização)
- **Hierarquia:** Empresa → Projetos → Iterações → Artefatos
- **Roles por empresa:** `admin` | `membro`
  - `admin`: gerencia usuários da empresa, acessa painel admin, configura agentes
  - `membro`: trabalha nos projetos, cria/edita artefatos, sem acesso ao admin

---

## Arquitetura Geral

```
Frontend (React)
├── AuthContext (useAuth)
│   └── depende de IAuthProvider (interface)
│       ├── SupabaseAuthAdapter (implementação atual)
│       └── CustomBackendAdapter (futuro — sem mudar UI)
├── usePermissions() — role-based, sem acoplamento ao provider
└── ProtectedRoute — redireciona se não autenticado/autorizado

Supabase
├── Auth (gerencia sessões, tokens)
├── membros_empresa (user_id → empresa_id + role)
└── RLS (empresa_do_usuario() filtra todas as queries)
```

---

## Schema do Banco de Dados

### Tabelas novas

```sql
-- Tenants
create table empresas (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  slug      text unique not null,
  criado_em timestamptz default now()
);

-- Membros por tenant
create table membros_empresa (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'membro')),
  criado_em  timestamptz default now(),
  unique(empresa_id, user_id)
);
```

### Alterações nas tabelas existentes

Adicionar `empresa_id uuid references empresas(id)` em:
- `projetos` (substituindo o campo `empresa text` existente)
- `iteracoes`
- `artefatos`
- `mensagens_agente`

Tabelas globais (sem tenant): `atividades`, `configuracoes_atividade`, `agentes_config`.

### Função helper + RLS

```sql
create function empresa_do_usuario()
returns uuid language sql stable security definer as $$
  select empresa_id from membros_empresa
  where user_id = auth.uid()
  limit 1
$$;

-- Substituir as políticas "allow_all_*" por:
create policy "tenant_projetos" on projetos
  for all using (empresa_id = empresa_do_usuario())
  with check (empresa_id = empresa_do_usuario());
-- (idem para iteracoes, artefatos, mensagens_agente)
```

---

## Camadas React (FSD)

### `src/shared/auth/`

**`IAuthProvider.ts`** — interface pública, nunca expõe tipos do Supabase:

```typescript
export interface AuthUser {
  id: string
  email: string
  empresaId: string
  role: 'admin' | 'membro'
}

export interface IAuthProvider {
  signIn(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
  getSession(): Promise<AuthUser | null>
}
```

**`SupabaseAuthAdapter.ts`** — implementa `IAuthProvider` usando Supabase Auth + query em `membros_empresa`. Tipos do Supabase ficam encapsulados aqui.

**`AuthContext.tsx`** — React Context com `user: AuthUser | null`, `loading`, `signOut()`. Recebe `provider: IAuthProvider` como prop para facilitar troca futura.

**`useAuth.ts`** — `useContext(AuthContext)`.

**`usePermissions.ts`** — lê `user.role`, expõe `isAdmin` e `can(action: Permission)`.

```typescript
type Permission =
  | 'gerenciar_usuarios'
  | 'editar_projeto'
  | 'aprovar_artefato'
  | 'ver_admin'

const PERMISSION_MAP: Record<'admin' | 'membro', Permission[]> = {
  admin:  ['gerenciar_usuarios', 'editar_projeto', 'aprovar_artefato', 'ver_admin'],
  membro: ['editar_projeto', 'aprovar_artefato'],
}
```

### `src/features/auth/`

- `LoginPage` — formulário email/senha, chama `provider.signIn()`
- `useLoginMutation` — TanStack Query mutation wrapping o provider
- Sem cadastro de usuário pela UI por enquanto (admin cria via painel Supabase ou futuro painel)

### `src/entities/user/` e `src/entities/empresa/`

- Tipos `User`, `Empresa`, `MembroEmpresa`
- Queries de leitura (useEmpresa, useMembros)

### `src/app/router/`

- `<ProtectedRoute>` — verifica `useAuth().user`; redireciona `/login` se não autenticado
- `<AdminRoute>` — verifica `usePermissions().isAdmin`; redireciona se não admin

---

## Plano de Migração de Dados Existentes

1. Criar empresa "Demo" com slug `demo`
2. Migrar o campo `empresa text` de `projetos` para FK `empresa_id` apontando para "Demo"
3. Remover coluna `empresa text` após migração

---

## Como Trocar o Backend Futuramente

1. Criar `CustomBackendAdapter` implementando `IAuthProvider`
2. Passar o novo adapter para `<AuthProvider provider={new CustomBackendAdapter()} />`
3. Zero mudanças na UI, nos hooks, nas páginas

---

## O que NÃO está no escopo

- Cadastro de usuários pela UI (admin cria via Supabase Studio ou painel futuro)
- OAuth / social login
- Multi-empresa por usuário (usuário pertence a uma empresa só por ora)
- Permissões por projeto individual

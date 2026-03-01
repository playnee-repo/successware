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

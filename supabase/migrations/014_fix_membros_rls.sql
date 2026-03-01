-- supabase/migrations/014_fix_membros_rls.sql
-- Fix: políticas recursivas em membros_empresa causavam retorno vazio no login

-- Função security definer para checar se o usuário é admin de uma empresa
-- (security definer = bypass RLS, sem recursão)
create or replace function is_admin_de(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from membros_empresa
    where user_id = auth.uid()
      and empresa_id = p_empresa_id
      and role = 'admin'
  )
$$;

-- Remove policies antigas (recursivas)
drop policy if exists "tenant_membros_select" on membros_empresa;
drop policy if exists "tenant_membros_admin_write" on membros_empresa;

-- SELECT: usuário sempre vê sua própria linha (necessário para autenticação)
create policy "membros_own_select" on membros_empresa
  for select using (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: apenas admins da empresa
create policy "membros_admin_insert" on membros_empresa
  for insert with check (is_admin_de(empresa_id));

create policy "membros_admin_update" on membros_empresa
  for update using (is_admin_de(empresa_id));

create policy "membros_admin_delete" on membros_empresa
  for delete using (is_admin_de(empresa_id));

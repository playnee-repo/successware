-- supabase/migrations/016_membros_functions.sql

-- Lista membros da empresa do usuário logado (com email via auth.users)
create or replace function listar_membros()
returns table(id uuid, user_id uuid, email text, role text, criado_em timestamptz)
language sql
security definer
as $$
  select me.id, me.user_id, u.email::text, me.role, me.criado_em
  from membros_empresa me
  join auth.users u on u.id = me.user_id
  where me.empresa_id = empresa_do_usuario()
  order by me.criado_em
$$;

-- Adiciona um usuário existente à empresa do admin logado
create or replace function adicionar_membro(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
begin
  select empresa_id into v_empresa_id
  from membros_empresa where user_id = auth.uid() limit 1;

  if not is_admin_de(v_empresa_id) then
    raise exception 'Apenas administradores podem gerenciar membros';
  end if;

  insert into membros_empresa (empresa_id, user_id, role)
  values (v_empresa_id, p_user_id, p_role)
  on conflict (empresa_id, user_id) do update set role = p_role;
end;
$$;

-- Remove um membro da empresa do admin logado
create or replace function remover_membro(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
begin
  select empresa_id into v_empresa_id
  from membros_empresa where user_id = auth.uid() limit 1;

  if not is_admin_de(v_empresa_id) then
    raise exception 'Apenas administradores podem remover membros';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  delete from membros_empresa
  where empresa_id = v_empresa_id and user_id = p_user_id;
end;
$$;

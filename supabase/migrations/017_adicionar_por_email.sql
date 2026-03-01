-- supabase/migrations/017_adicionar_por_email.sql
-- Adiciona membro à empresa buscando por email em auth.users
-- Retorna 'ok' se adicionado, 'not_found' se usuário não existe

create or replace function adicionar_membro_por_email(p_email text, p_role text)
returns text
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
  v_user_id uuid;
begin
  select empresa_id into v_empresa_id
  from membros_empresa where user_id = auth.uid() limit 1;

  if not is_admin_de(v_empresa_id) then
    raise exception 'Apenas administradores podem gerenciar membros';
  end if;

  -- Busca o user_id pelo email em auth.users (security definer acessa auth schema)
  select id into v_user_id
  from auth.users
  where email = p_email
  limit 1;

  if v_user_id is null then
    return 'not_found';
  end if;

  insert into membros_empresa (empresa_id, user_id, role)
  values (v_empresa_id, v_user_id, p_role)
  on conflict (empresa_id, user_id) do update set role = p_role;

  return 'ok';
end;
$$;

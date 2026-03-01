-- supabase/migrations/015_registrar_usuario.sql
-- Função security definer para registrar novo usuário com empresa própria
-- Necessário pois o usuário recém-criado não tem linha em membros_empresa ainda

create or replace function registrar_usuario(p_empresa_nome text)
returns void
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
  v_slug text;
begin
  -- Gera slug único a partir do nome
  v_slug := lower(regexp_replace(p_empresa_nome, '[^a-zA-Z0-9]+', '-', 'g'))
             || '-' || substring(gen_random_uuid()::text, 1, 8);

  insert into empresas (nome, slug)
  values (p_empresa_nome, v_slug)
  returning id into v_empresa_id;

  insert into membros_empresa (empresa_id, user_id, role)
  values (v_empresa_id, auth.uid(), 'admin');
end;
$$;

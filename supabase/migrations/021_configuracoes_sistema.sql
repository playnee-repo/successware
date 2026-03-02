-- ─── Tabela: configuracoes_sistema ──────────────────────────────────────────
-- Feature flags e preferências por empresa.
-- Cada admin da empresa pode habilitar/desabilitar funcionalidades.
-- chave:  identificador da configuração (ex: 'advisor_enabled')
-- valor:  valor JSONB (ex: true, false, "string", {"k":"v"})

create table if not exists configuracoes_sistema (
  id             uuid        primary key default gen_random_uuid(),
  empresa_id     uuid        not null references empresas(id) on delete cascade,
  chave          text        not null,
  valor          jsonb       not null default 'true'::jsonb,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid        references auth.users(id),
  constraint uq_config_empresa_chave unique (empresa_id, chave)
);

-- Atualizar timestamp automaticamente
create trigger trg_configuracoes_sistema_atualizado_em
  before update on configuracoes_sistema
  for each row execute function update_atualizado_em();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table configuracoes_sistema enable row level security;

-- Todos os membros da empresa podem ler
create policy "tenant_configuracoes_select"
  on configuracoes_sistema for select
  using (empresa_id = empresa_do_usuario());

-- Apenas admins podem criar/editar/deletar
create policy "tenant_configuracoes_insert"
  on configuracoes_sistema for insert
  with check (
    empresa_id = empresa_do_usuario()
    and is_admin_de(empresa_do_usuario())
  );

create policy "tenant_configuracoes_update"
  on configuracoes_sistema for update
  using (
    empresa_id = empresa_do_usuario()
    and is_admin_de(empresa_do_usuario())
  );

create policy "tenant_configuracoes_delete"
  on configuracoes_sistema for delete
  using (
    empresa_id = empresa_do_usuario()
    and is_admin_de(empresa_do_usuario())
  );

-- ─── Function: set_configuracao ──────────────────────────────────────────────
-- Upsert seguro: verifica admin, registra quem alterou e quando.

create or replace function set_configuracao(p_chave text, p_valor jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_user_id    uuid;
begin
  v_empresa_id := empresa_do_usuario();
  v_user_id    := auth.uid();

  if v_empresa_id is null then
    raise exception 'Usuário não associado a uma empresa';
  end if;

  if not is_admin_de(v_empresa_id) then
    raise exception 'Apenas administradores podem alterar configurações do sistema';
  end if;

  insert into configuracoes_sistema (empresa_id, chave, valor, atualizado_por)
  values (v_empresa_id, p_chave, p_valor, v_user_id)
  on conflict (empresa_id, chave)
  do update set
    valor          = excluded.valor,
    atualizado_em  = now(),
    atualizado_por = excluded.atualizado_por;
end;
$$;

-- Revogar acesso público direto à função (apenas via client auth)
revoke execute on function set_configuracao(text, jsonb) from public;
grant  execute on function set_configuracao(text, jsonb) to authenticated;

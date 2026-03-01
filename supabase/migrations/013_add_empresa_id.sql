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

drop policy if exists "allow_all_projetos" on projetos;

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

drop policy if exists "allow_all_artefatos" on artefatos;

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
alter table documentos_projeto add column if not exists empresa_id uuid references empresas(id);

drop policy if exists "allow_all_documentos_projeto" on documentos_projeto;

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

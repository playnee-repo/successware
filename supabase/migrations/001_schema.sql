-- SDLC Copilot — Schema MVP
-- Disciplinas SDLC: descoberta, requisitos, arquitetura, construcao, qualidade

-- ============================================================
-- PROJETOS
-- ============================================================
create table if not exists projetos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  status      text not null default 'ativo' check (status in ('ativo', 'pausado', 'concluido', 'arquivado')),
  empresa     text,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ============================================================
-- ITERAÇÕES
-- ============================================================
create table if not exists iteracoes (
  id            uuid primary key default gen_random_uuid(),
  projeto_id    uuid not null references projetos(id) on delete cascade,
  nome          text not null,
  modulo_foco   text,
  status        text not null default 'planejada' check (status in ('planejada', 'ativa', 'concluida')),
  ordem         integer not null default 1,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ============================================================
-- ATIVIDADES (templates por disciplina — shared across projects)
-- ============================================================
create table if not exists atividades (
  id           uuid primary key default gen_random_uuid(),
  disciplina   text not null check (disciplina in ('descoberta', 'requisitos', 'arquitetura', 'construcao', 'qualidade')),
  nome         text not null,
  descricao    text,
  agente       text not null default 'SCRIBE',
  ordem        integer not null default 1,
  icone        text,
  criado_em    timestamptz not null default now()
);

-- ============================================================
-- DEFINIÇÕES DE INSUMOS (schema / template por atividade)
-- ============================================================
create table if not exists definicoes_insumos (
  id                    uuid primary key default gen_random_uuid(),
  atividade_id          uuid not null references atividades(id) on delete cascade,
  tipo_insumo           text not null,
  agente_responsavel    text not null default 'SCRIBE',
  schema_metadado_json  jsonb,
  prompt_template       text,
  criado_em             timestamptz not null default now()
);

-- ============================================================
-- INSUMOS DO PROJETO (artefatos versionados por iteração)
-- ============================================================
create table if not exists insumos_projeto (
  id                 uuid primary key default gen_random_uuid(),
  iteracao_id        uuid not null references iteracoes(id) on delete cascade,
  atividade_id       uuid not null references atividades(id) on delete cascade,
  definicao_id       uuid not null references definicoes_insumos(id) on delete cascade,
  conteudo_json      jsonb not null default '{}',
  versao             integer not null default 1,
  agente_autor       text not null default 'SCRIBE',
  status_aprovacao   text not null default 'rascunho' check (status_aprovacao in ('rascunho', 'em_revisao', 'aprovado', 'rejeitado')),
  preferencia_view   text not null default 'visual' check (preferencia_view in ('visual', 'rawjson')),
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

-- Índice para busca rápida por iteração + atividade + definição
create index idx_insumos_iteracao_atividade on insumos_projeto(iteracao_id, atividade_id, definicao_id);

-- ============================================================
-- MENSAGENS DO AGENTE (histórico de chat por iteração)
-- ============================================================
create table if not exists mensagens_agente (
  id            uuid primary key default gen_random_uuid(),
  iteracao_id   uuid not null references iteracoes(id) on delete cascade,
  disciplina    text not null,
  agente        text not null default 'SCRIBE',
  tipo          text not null check (tipo in ('user', 'agent', 'system', 'action')),
  conteudo      text not null,
  metadados_json jsonb,
  criado_em     timestamptz not null default now()
);

create index idx_mensagens_iteracao on mensagens_agente(iteracao_id, criado_em);

-- ============================================================
-- TRIGGER: atualizar atualizado_em automaticamente
-- ============================================================
create or replace function update_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projetos_atualizado_em
  before update on projetos
  for each row execute function update_atualizado_em();

create trigger trg_iteracoes_atualizado_em
  before update on iteracoes
  for each row execute function update_atualizado_em();

create trigger trg_insumos_atualizado_em
  before update on insumos_projeto
  for each row execute function update_atualizado_em();

-- ============================================================
-- RLS (Row Level Security) — desabilitado para MVP local
-- ============================================================
alter table projetos enable row level security;
alter table iteracoes enable row level security;
alter table atividades enable row level security;
alter table definicoes_insumos enable row level security;
alter table insumos_projeto enable row level security;
alter table mensagens_agente enable row level security;

-- Política aberta para desenvolvimento local (sem autenticação)
create policy "allow_all_projetos" on projetos for all using (true) with check (true);
create policy "allow_all_iteracoes" on iteracoes for all using (true) with check (true);
create policy "allow_all_atividades" on atividades for all using (true) with check (true);
create policy "allow_all_definicoes" on definicoes_insumos for all using (true) with check (true);
create policy "allow_all_insumos" on insumos_projeto for all using (true) with check (true);
create policy "allow_all_mensagens" on mensagens_agente for all using (true) with check (true);

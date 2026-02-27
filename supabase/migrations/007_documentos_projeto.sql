-- Documentos do Projeto
-- Documentos de contexto (visão, requisitos não-funcionais, glossário, etc.)
-- que são injetados automaticamente em todos os prompts de IA do projeto.

create table if not exists documentos_projeto (
  id            uuid primary key default gen_random_uuid(),
  projeto_id    uuid not null references projetos(id) on delete cascade,
  titulo        text not null,
  conteudo_md   text not null default '',
  ordem         integer not null default 0,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists documentos_projeto_projeto_id_idx
  on documentos_projeto(projeto_id);

alter table documentos_projeto enable row level security;

create policy "allow_all_documentos_projeto" on documentos_projeto
  for all using (true) with check (true);

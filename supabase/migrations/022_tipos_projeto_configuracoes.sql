-- ─── tipos_projeto em configuracoes_atividade ────────────────────────────────
-- Permite restringir uma configuração de atividade a tipos específicos
-- de projeto (ex: 'startup_mvp', 'api', 'app_mobile').
--
-- null   = aparece para TODOS os tipos de projeto (comportamento atual)
-- array  = aparece apenas para os tipos listados
--
-- Nenhuma mudança de RLS necessária: a política global de leitura já cobre.

alter table configuracoes_atividade
  add column if not exists tipos_projeto text[];

comment on column configuracoes_atividade.tipos_projeto is
  'null = todos os tipos. Preencher com array de tipos (ex: {startup_mvp,api}) para restringir.';

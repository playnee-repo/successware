-- supabase/migrations/018_projeto_tipo.sql
-- Adiciona campo tipo (enum) e contexto_ia (texto livre para o ADVISOR) em projetos

alter table projetos
  add column if not exists tipo text
    check (tipo in ('startup_mvp', 'saas', 'app_mobile', 'api', 'sistema_interno', 'outro'))
    default 'outro',
  add column if not exists contexto_ia text;

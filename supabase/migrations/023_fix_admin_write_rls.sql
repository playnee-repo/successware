-- ─── Fix: políticas de escrita para tabelas globais de configuração ──────────
--
-- Migration 013 removeu as políticas "for all" de atividades e
-- configuracoes_atividade, deixando apenas SELECT (global_*_read).
-- Isso bloqueava silenciosamente qualquer INSERT/UPDATE/DELETE do admin.
--
-- Solução: qualquer usuário autenticado com role 'admin' na sua empresa
-- pode escrever nessas tabelas globais de configuração.
-- Em produção com multi-tenant, isso equivale a um "admin de sistema"
-- porque as tabelas são compartilhadas entre todos os tenants.

-- ─── atividades ──────────────────────────────────────────────────────────────

create policy "admin_atividades_write"
  on atividades
  for all
  using     (is_admin_de(empresa_do_usuario()))
  with check(is_admin_de(empresa_do_usuario()));

-- ─── configuracoes_atividade ─────────────────────────────────────────────────

create policy "admin_configuracoes_write"
  on configuracoes_atividade
  for all
  using     (is_admin_de(empresa_do_usuario()))
  with check(is_admin_de(empresa_do_usuario()));

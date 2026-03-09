-- Apenas INSERTs em configuracoes_atividade (novas definições)
-- Local: Supabase Studio (http://127.0.0.1:54323) → SQL Editor
-- Produção: Supabase Dashboard → SQL Editor

INSERT INTO configuracoes_atividade (id, atividade_id, nome, tipo_insumo, agente_responsavel, prompt_template)
VALUES
  ('d5000001-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000001', 'Plano de Testes', 'plano_testes', 'GUARDIAN', 'Você é GUARDIAN, especialista em qualidade e testes.

Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}

Elabore um plano de testes com estratégia, tipos de teste (unitário, integração, e2e) e cenários principais.
Retorne APENAS JSON válido.'),
  ('d5000002-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000002', 'Testes de Aceitação', 'testes_aceitacao', 'GUARDIAN', 'Você é GUARDIAN. Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}. Gere cenários de testes de aceitação. Retorne APENAS JSON válido.'),
  ('d5000003-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000003', 'Revisão de Segurança', 'revisao_seguranca', 'GUARDIAN', 'Você é GUARDIAN. Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}. Faça uma revisão de segurança e liste checklist e recomendações. Retorne APENAS JSON válido.'),
  ('d1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'Briefing Inicial', 'briefing', 'SCRIBE', 'Projeto: {{projeto_nome}}. Gere um briefing inicial. Retorne JSON válido.'),
  ('d1000002-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000002', 'Análise de Stakeholders', 'stakeholders', 'SCRIBE', 'Projeto: {{projeto_nome}}. Mapeie stakeholders. Retorne JSON válido.'),
  ('d1000003-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003', 'Benchmarking', 'benchmarking', 'SCRIBE', 'Projeto: {{projeto_nome}}. Faça benchmarking. Retorne JSON válido.'),
  ('d3000001-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000001', 'Diagrama de Contexto', 'diagrama_contexto', 'ARCH', 'Projeto: {{projeto_nome}}. Gere diagrama de contexto. Retorne JSON válido.'),
  ('d3000002-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000002', 'Modelo de Dados', 'modelo_dados', 'ARCH', 'Projeto: {{projeto_nome}}. Gere modelo de dados. Retorne JSON válido.'),
  ('d3000003-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000003', 'Stack Tecnológico', 'stack', 'ARCH', 'Projeto: {{projeto_nome}}. Defina stack tecnológico. Retorne JSON válido.'),
  ('d4000001-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000001', 'Setup do Ambiente', 'setup', 'FORGE', 'Projeto: {{projeto_nome}}. Documente setup do ambiente. Retorne JSON válido.'),
  ('d4000002-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000002', 'Implementação Core', 'implementacao', 'FORGE', 'Projeto: {{projeto_nome}}. Documente implementação core. Retorne JSON válido.'),
  ('d4000003-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000003', 'Integração de APIs', 'apis', 'FORGE', 'Projeto: {{projeto_nome}}. Documente integração de APIs. Retorne JSON válido.'),
  ('d2000002-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000002', 'Prototipação de Interface', 'prototipacao', 'SCRIBE', 'Projeto: {{projeto_nome}}. Gere esboço de prototipação. Retorne JSON válido.')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo_insumo = EXCLUDED.tipo_insumo,
  agente_responsavel = EXCLUDED.agente_responsavel,
  prompt_template = EXCLUDED.prompt_template;

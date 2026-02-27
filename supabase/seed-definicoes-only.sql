-- Apenas INSERTs em definicoes_insumos (novas definições)
-- Usar: npx supabase db execute -f supabase/seed-definicoes-only.sql
-- Ou rodar no SQL Editor do Supabase Dashboard

INSERT INTO definicoes_insumos (id, atividade_id, tipo_insumo, agente_responsavel, schema_metadado_json, prompt_template)
VALUES
  ('d5000001-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000001', 'plano_testes', 'GUARDIAN', '{"type": "object", "properties": {"estrategia": {"type": "string"}, "tipos_teste": {"type": "array"}, "cenarios": {"type": "array"}}}', 'Você é GUARDIAN, especialista em qualidade e testes.

Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}

Elabore um plano de testes com estratégia, tipos de teste (unitário, integração, e2e) e cenários principais.
Retorne APENAS JSON válido.'),
  ('d5000002-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000002', 'testes_aceitacao', 'GUARDIAN', '{"type": "object", "properties": {"cenarios": {"type": "array"}}}', 'Você é GUARDIAN. Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}. Gere cenários de testes de aceitação. Retorne APENAS JSON válido.'),
  ('d5000003-0000-0000-0000-000000000001', 'a5000001-0000-0000-0000-000000000003', 'revisao_seguranca', 'GUARDIAN', '{"type": "object", "properties": {"checklist": {"type": "array"}, "recomendacoes": {"type": "array"}}}', 'Você é GUARDIAN. Projeto: {{projeto_nome}} | Módulo: {{iteracao_modulo}}. Faça uma revisão de segurança e liste checklist e recomendações. Retorne APENAS JSON válido.'),
  ('d1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'briefing', 'SCRIBE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Gere um briefing inicial. Retorne JSON válido.'),
  ('d1000002-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000002', 'stakeholders', 'SCRIBE', '{"type": "object", "properties": {"stakeholders": {"type": "array"}}}', 'Projeto: {{projeto_nome}}. Mapeie stakeholders. Retorne JSON válido.'),
  ('d1000003-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003', 'benchmarking', 'SCRIBE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Faça benchmarking. Retorne JSON válido.'),
  ('d3000001-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000001', 'diagrama_contexto', 'ARCH', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Gere diagrama de contexto. Retorne JSON válido.'),
  ('d3000002-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000002', 'modelo_dados', 'ARCH', '{"type": "object", "properties": {"entidades": {"type": "array"}}}', 'Projeto: {{projeto_nome}}. Gere modelo de dados. Retorne JSON válido.'),
  ('d3000003-0000-0000-0000-000000000001', 'a3000001-0000-0000-0000-000000000003', 'stack', 'ARCH', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Defina stack tecnológico. Retorne JSON válido.'),
  ('d4000001-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000001', 'setup', 'FORGE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Documente setup do ambiente. Retorne JSON válido.'),
  ('d4000002-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000002', 'implementacao', 'FORGE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Documente implementação core. Retorne JSON válido.'),
  ('d4000003-0000-0000-0000-000000000001', 'a4000001-0000-0000-0000-000000000003', 'apis', 'FORGE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Documente integração de APIs. Retorne JSON válido.'),
  ('d2000002-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000002', 'prototipacao', 'SCRIBE', '{"type": "object"}', 'Projeto: {{projeto_nome}}. Gere esboço de prototipação. Retorne JSON válido.')
ON CONFLICT (id) DO NOTHING;

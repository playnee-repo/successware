-- Migration 011: Remove schema_metadado_json from configuracoes_atividade
-- O conteúdo gerado é sempre Markdown (conteudo_json.md); o schema não é mais usado.

ALTER TABLE configuracoes_atividade DROP COLUMN IF EXISTS schema_metadado_json;

-- Migration 010: Rename definicoes_insumos → configuracoes_atividade
-- Rename FK column definicao_id → configuracao_id in artefatos
-- Add nome column to configuracoes_atividade

ALTER TABLE definicoes_insumos RENAME TO configuracoes_atividade;

ALTER TABLE artefatos RENAME COLUMN definicao_id TO configuracao_id;

ALTER TABLE configuracoes_atividade ADD COLUMN nome TEXT NOT NULL DEFAULT '';

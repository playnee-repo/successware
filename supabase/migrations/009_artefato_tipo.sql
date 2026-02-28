-- Migration 009: adiciona coluna 'tipo' à tabela artefatos
ALTER TABLE artefatos ADD COLUMN tipo TEXT NOT NULL DEFAULT 'texto';

ALTER TABLE artefatos ADD CONSTRAINT artefatos_tipo_check
  CHECK (tipo IN ('texto', 'link', 'documento'));

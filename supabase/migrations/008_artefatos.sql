-- Migration 002: Renomear insumos_projeto → artefatos + suporte a múltiplos artefatos por atividade

-- 1. Renomear a tabela
ALTER TABLE insumos_projeto RENAME TO artefatos;

-- 2. Adicionar coluna nome (identifica o artefato único dentro da atividade)
ALTER TABLE artefatos ADD COLUMN nome TEXT NOT NULL DEFAULT 'Artefato sem título';

-- 3. Tornar definicao_id opcional (drop NOT NULL + recriar FK com ON DELETE SET NULL)
ALTER TABLE artefatos ALTER COLUMN definicao_id DROP NOT NULL;
ALTER TABLE artefatos DROP CONSTRAINT insumos_projeto_definicao_id_fkey;
ALTER TABLE artefatos ADD CONSTRAINT artefatos_definicao_id_fkey
  FOREIGN KEY (definicao_id) REFERENCES definicoes_insumos(id) ON DELETE SET NULL;

-- 4. Recriar índice com nome novo
DROP INDEX IF EXISTS idx_insumos_iteracao_atividade;
CREATE INDEX idx_artefatos_iteracao_atividade ON artefatos(iteracao_id, atividade_id);
CREATE INDEX idx_artefatos_iteracao_atividade_nome ON artefatos(iteracao_id, atividade_id, nome);

-- 5. Recriar trigger com nome novo
DROP TRIGGER IF EXISTS trg_insumos_atualizado_em ON artefatos;
CREATE TRIGGER trg_artefatos_atualizado_em
  BEFORE UPDATE ON artefatos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 6. Recriar RLS policy
DROP POLICY IF EXISTS "allow_all_insumos" ON artefatos;
CREATE POLICY "allow_all_artefatos" ON artefatos FOR ALL USING (true) WITH CHECK (true);

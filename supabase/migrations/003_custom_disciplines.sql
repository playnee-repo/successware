-- SDLC Copilot — Remove disciplina CHECK constraint to allow custom disciplines

-- Drop the existing check constraint on atividades.disciplina
ALTER TABLE atividades DROP CONSTRAINT IF EXISTS atividades_disciplina_check;

-- No new constraint — disciplina is now a free-text field
-- The five default disciplines still work; admins can add custom ones

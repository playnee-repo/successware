-- Atividades passa a referenciar disciplinas (integridade referencial)
-- 1) Inserir em disciplinas qualquer disciplina usada em atividades que ainda não exista
-- 2) Adicionar FK atividades.disciplina -> disciplinas.id

INSERT INTO disciplinas (id, nome, descricao, cor, icone, ordem)
SELECT DISTINCT
  a.disciplina,
  initcap(replace(a.disciplina, '_', ' ')),
  NULL,
  'indigo',
  NULL,
  999
FROM atividades a
WHERE NOT EXISTS (SELECT 1 FROM disciplinas d WHERE d.id = a.disciplina)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE atividades
  ADD CONSTRAINT atividades_disciplina_fkey
  FOREIGN KEY (disciplina)
  REFERENCES disciplinas(id)
  ON DELETE RESTRICT;

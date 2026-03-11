-- Successware — Tabela de disciplinas (lookup com nome, descrição, cor, ordem)
-- Substitui constantes hardcoded no frontend.

CREATE TABLE IF NOT EXISTS disciplinas (
  id          text PRIMARY KEY,
  nome        text NOT NULL,
  descricao   text,
  cor         text NOT NULL DEFAULT 'indigo',
  icone       text,
  ordem       integer NOT NULL DEFAULT 0,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- RLS: leitura pública (disciplinas são globais)
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disciplinas_select_all" ON disciplinas FOR SELECT USING (true);
CREATE POLICY "disciplinas_manage_auth" ON disciplinas FOR ALL USING (auth.role() = 'authenticated');

-- Seed das 5 disciplinas padrão
INSERT INTO disciplinas (id, nome, descricao, cor, icone, ordem) VALUES
  ('descoberta',  'Descoberta',                'Levantamento inicial de necessidades, stakeholders e contexto de negócio.',                   'violet',  'Search',   1),
  ('requisitos',  'Engenharia de Requisitos',   'Elicitação, documentação e validação de requisitos funcionais e não-funcionais.',             'indigo',  'FileText', 2),
  ('arquitetura', 'Arquitetura',                'Design da arquitetura do sistema, modelo de dados e decisões técnicas.',                      'blue',    'Layers',   3),
  ('construcao',  'Construção',                 'Implementação das funcionalidades conforme os requisitos aprovados.',                         'orange',  'Hammer',   4),
  ('qualidade',   'Qualidade',                  'Plano de testes, validação e revisão de segurança do sistema.',                               'emerald', 'Shield',   5)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  cor = EXCLUDED.cor,
  icone = EXCLUDED.icone,
  ordem = EXCLUDED.ordem;

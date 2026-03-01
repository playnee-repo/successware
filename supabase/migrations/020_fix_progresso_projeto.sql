-- supabase/migrations/020_fix_progresso_projeto.sql
-- Corrige progresso_projeto para usar média por ATIVIDADE (igual ao DisciplinaView)
-- em vez de ratio por artefato.
--
-- Lógica:
--   progress(atividade) = aprovados_únicos / total_únicos  (0 se sem artefatos)
--   progress(disciplina) = avg(progress de cada atividade na disciplina)
--   total_artefatos      = nº de atividades que têm pelo menos 1 artefato
--                          (usado no frontend para filtrar disciplinas "vazias")

create or replace function progresso_projeto(p_projeto_id uuid)
returns table(
  disciplina      text,
  total_artefatos bigint,   -- atividades com ≥1 artefato (filtra disciplinas vazias)
  aprovados       bigint,   -- atividades com ≥1 artefato aprovado
  progresso       numeric   -- média do progresso por atividade (0-100)
)
language sql
security definer
as $$
  with atividade_progresso as (
    -- Para cada atividade, pega a versão mais recente de cada nome único
    select
      a.id          as atividade_id,
      a.disciplina,
      count(distinct nomes.nome)                               as total_nomes,
      count(distinct nomes.nome) filter (where nomes.aprovado) as nomes_aprovados
    from atividades a
    left join (
      -- Versão mais recente de cada (iteracao, atividade, nome)
      select distinct on (art.iteracao_id, art.atividade_id, art.nome)
        art.atividade_id,
        art.nome,
        (art.status_aprovacao = 'aprovado') as aprovado
      from artefatos art
      where art.iteracao_id in (
        select id from iteracoes where projeto_id = p_projeto_id
      )
      order by art.iteracao_id, art.atividade_id, art.nome, art.versao desc
    ) nomes on nomes.atividade_id = a.id
    group by a.id, a.disciplina
  )
  select
    disciplina,
    -- total_artefatos = atividades que têm trabalho iniciado
    count(*) filter (where total_nomes > 0)                             as total_artefatos,
    count(*) filter (where nomes_aprovados > 0)                         as aprovados,
    -- progresso = média do progresso de cada atividade (incluindo as com 0 artefatos)
    round(
      100.0 * avg(
        case when total_nomes > 0
          then nomes_aprovados::numeric / total_nomes
          else 0
        end
      ),
    0)                                                                  as progresso
  from atividade_progresso
  group by disciplina
  order by disciplina
$$;

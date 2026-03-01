-- supabase/migrations/019_progresso_projeto.sql
-- Função que retorna progresso por disciplina para um projeto
-- Considera apenas a versão mais recente de cada artefato (por nome + iteracao + atividade)

create or replace function progresso_projeto(p_projeto_id uuid)
returns table(
  disciplina text,
  total_artefatos bigint,
  aprovados bigint,
  progresso numeric
)
language sql
security definer
as $$
  select
    a.disciplina,
    count(distinct art.nome)                                         as total_artefatos,
    count(distinct art.nome) filter (
      where art.status_aprovacao = 'aprovado'
        and art.versao = (
          select max(a2.versao) from artefatos a2
          where a2.iteracao_id = art.iteracao_id
            and a2.atividade_id = art.atividade_id
            and a2.nome = art.nome
        )
    )                                                                as aprovados,
    round(
      100.0 * count(distinct art.nome) filter (
        where art.status_aprovacao = 'aprovado'
          and art.versao = (
            select max(a2.versao) from artefatos a2
            where a2.iteracao_id = art.iteracao_id
              and a2.atividade_id = art.atividade_id
              and a2.nome = art.nome
          )
      ) / nullif(count(distinct art.nome), 0),
    0)                                                               as progresso
  from atividades a
  left join artefatos art
    on art.atividade_id = a.id
    and art.iteracao_id in (
      select id from iteracoes where projeto_id = p_projeto_id
    )
  group by a.disciplina
  order by a.disciplina
$$;

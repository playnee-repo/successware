-- Remove linhas em branco consecutivas dos campos de prompt/texto longo.
-- Corrige dados acumulados pelo BlockNote editor (blocksToMarkdownLossy adicionava \n\n entre blocos).

update definicoes_insumos
set prompt_template = trim(regexp_replace(prompt_template, '\n{2,}', E'\n', 'g'))
where prompt_template is not null
  and prompt_template ~ '\n{2,}';

update agentes_config
set system_prompt = trim(regexp_replace(system_prompt, '\n{2,}', E'\n', 'g'))
where system_prompt is not null
  and system_prompt ~ '\n{2,}';

update agentes_config
set chat_system_prompt = trim(regexp_replace(chat_system_prompt, '\n{2,}', E'\n', 'g'))
where chat_system_prompt is not null
  and chat_system_prompt ~ '\n{2,}';

-- ADVISOR: agente copiloto proativo, padrão desativado
-- O ADVISOR analisa o estado do projeto e sugere recomendações.
-- Habilitado via configuração advisor_enabled por empresa.

insert into agentes_config (id, nome, descricao, system_prompt, chat_system_prompt, modelo, temperatura, top_k, top_p, max_output_tokens, ativo) values
(
  'ADVISOR',
  'ADVISOR',
  'Copiloto proativo de engenharia de software. Analisa o estado do projeto e sugere a próxima ação de maior impacto.',
  'Você é o ADVISOR, um copiloto de engenharia de software.
Analise o estado atual do projeto e forneça UMA recomendação concisa e acionável.
Tom: parceiro experiente, direto, sem jargão, sem formalidade. Em português.

Responda APENAS com JSON válido (sem markdown, sem explicação):
{
  "titulo": "título curto (máx 5 palavras)",
  "mensagem": "observação clara + impacto em 1-2 frases",
  "acao": "texto do botão (máx 4 palavras)",
  "disciplina": "descoberta|requisitos|arquitetura|construcao|qualidade ou null"
}',
  null,
  'gemini-2.5-flash',
  0.7,
  40,
  0.95,
  8192,
  false
)
on conflict (id) do update set
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  system_prompt = EXCLUDED.system_prompt,
  ativo = EXCLUDED.ativo;

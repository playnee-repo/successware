/**
 * Biblioteca central de templates de configuração de atividade.
 * Prompts já mapeados — use no Admin ao criar/editar configuração
 * para evitar digitar o prompt do zero.
 */

export interface ConfiguracaoTemplate {
  /** Identificador do tipo (ex.: user_stories, requisitos_funcionais) */
  tipo_insumo: string
  /** Nome para exibição no seletor */
  nome: string
  /** Agente padrão */
  agente: string
  /** Prompt com placeholders {{projeto_nome}}, {{iteracao_modulo}}, {{contexto}} */
  prompt_template: string
}

/** @deprecated Use ConfiguracaoTemplate instead */
export type DefinicaoTemplate = ConfiguracaoTemplate

const MARKDOWN_INSTRUCTION = `
Retorne APENAS o Markdown, sem blocos de código JSON, sem explicações adicionais.`

export const CONFIGURACOES_TEMPLATES: ConfiguracaoTemplate[] = [
  // =========================================================================
  // SCRIBE — DESCOBERTA
  // =========================================================================
  {
    tipo_insumo: 'briefing',
    nome: 'Briefing inicial',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em levantamento inicial de projetos.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Gere um Briefing Inicial completo. Use exatamente esta estrutura Markdown:

# Briefing Inicial — {{projeto_nome}}

## Objetivo
**Problema:** descreva o problema que o projeto resolve
**Solução proposta:** descreva a solução de forma objetiva
**Objetivo principal:** declare o objetivo mensurável

## Contexto de Negócio
**Segmento:** setor/nicho de mercado
**Público-alvo:** descrição do público principal
**Diferenciais:**
- diferencial 1
- diferencial 2

## Escopo
**Dentro do escopo:**
- funcionalidade 1
- funcionalidade 2

**Fora do escopo:**
- item excluído 1
- item excluído 2

## Restrições e Premissas
- restrição ou premissa 1
- restrição ou premissa 2

## Critérios de Sucesso
| KPI | Meta |
|-----|------|
| métrica 1 | valor alvo |
| métrica 2 | valor alvo |
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'stakeholders',
    nome: 'Análise de stakeholders',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em análise de stakeholders.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Mapeie os stakeholders do projeto. Use exatamente esta estrutura Markdown. Inclua mínimo 4 stakeholders:

# Análise de Stakeholders — {{projeto_nome}}

## [Nome do Stakeholder] — [Cargo/Papel]
**Tipo:** interno | externo
**Influência:** alta | média | baixa
**Interesse:** descrição do interesse no projeto
**Expectativas:**
- expectativa 1
- expectativa 2

**Estratégia de comunicação:** como engajar este stakeholder

---

## [Próximo Stakeholder] — [Cargo/Papel]
(repita o padrão acima para cada stakeholder)

## Mapa de Poder × Interesse
| Stakeholder | Poder | Interesse | Estratégia |
|-------------|-------|-----------|------------|
| nome | alto/médio/baixo | alto/médio/baixo | gerenciar de perto / manter satisfeito / etc |
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'benchmarking',
    nome: 'Benchmarking',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em análise competitiva e benchmarking.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Realize um benchmarking completo. Analise mínimo 3 concorrentes/produtos. Use esta estrutura:

# Benchmarking — {{projeto_nome}}

## [Nome do Concorrente 1] — [Categoria]
**Descrição:** breve descrição da solução
**Pontos fortes:**
- ponto forte 1
- ponto forte 2

**Pontos fracos:**
- ponto fraco 1
- ponto fraco 2

**Modelo de preço:** descrição do modelo de precificação

---

(repita para cada concorrente)

## Análise Comparativa
| Critério | Concorrente 1 | Concorrente 2 | Nossa Solução |
|----------|--------------|--------------|---------------|
| critério | status | status | status |

## Oportunidades Identificadas
- oportunidade 1
- oportunidade 2

## Diferenciais Competitivos da Nossa Solução
- diferencial 1
- diferencial 2
${MARKDOWN_INSTRUCTION}`,
  },

  // =========================================================================
  // SCRIBE — REQUISITOS
  // =========================================================================
  {
    tipo_insumo: 'prototipacao',
    nome: 'Prototipação de interface',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em UX e prototipação de interfaces.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente as telas e fluxos principais. Descreva mínimo 4 telas/fluxos. Use esta estrutura:

# Prototipação de Interface — {{iteracao_modulo}}

## [Nome da Tela/Fluxo]
**Tipo:** tela | modal | fluxo
**Objetivo:** objetivo desta tela para o usuário

**Elementos principais:**
- elemento 1 (ex.: header com logo e navegação)
- elemento 2 (ex.: campo de busca)
- elemento 3 (ex.: lista de itens com paginação)

**Interações:**
- Ao clicar em X → acontece Y
- Ao submeter formulário → validação e redirect

**Fluxo de navegação:** De onde vem → o que acontece → para onde vai

**Notas de UX:** considerações de acessibilidade e usabilidade

---

(repita para cada tela/fluxo)

## Fluxo Principal de Navegação
Descreva o fluxo completo em forma de texto ou diagrama textual (ex.: Login → Dashboard → Detalhe → Editar)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'user_stories',
    nome: 'User Stories (épico + stories)',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em Engenharia de Requisitos ágil.
Projeto: {{projeto_nome}}
Módulo/foco da iteração: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Gere mínimo 5 User Stories detalhadas. Cada story deve ter mínimo 3 critérios de aceite testáveis. Use esta estrutura:

# User Stories — {{iteracao_modulo}}

## US-001: [Título descritivo da story]
**Prioridade:** High | Medium | Low
**Estimativa:** N story points

**Como** [persona/papel],
**Quero** [ação/funcionalidade],
**Para** [benefício/objetivo de negócio].

**Critérios de aceite:**
- **Dado que** [contexto], **quando** [ação], **então** [resultado esperado].
- **Dado que** [contexto], **quando** [ação], **então** [resultado esperado].
- **Dado que** [contexto], **quando** [ação], **então** [resultado esperado].

---

## US-002: [Próxima story]
(repita o padrão acima)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'requisitos_funcionais',
    nome: 'Requisitos funcionais e não funcionais',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em levantamento de requisitos.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Gere mínimo 8 requisitos funcionais e 5 não funcionais. Inclua requisitos de LGPD se aplicável. Use esta estrutura:

# Requisitos — {{iteracao_modulo}}

## Requisitos Funcionais
O sistema DEVE atender aos seguintes requisitos:

### RF-001 — [Nome curto do requisito]
**Descrição:** descrição detalhada do que o sistema deve fazer, incluindo regras de negócio e comportamentos esperados.

### RF-002 — [Nome]
**Descrição:** ...

(continue para todos os RFs)

---

## Requisitos Não Funcionais
Qualidade, segurança, performance e conformidade:

### RNF-001 — [Nome] *(Performance)*
**Descrição:** descrição com métrica mensurável (ex.: resposta < 2s em 95% das requisições)

### RNF-002 — [Nome] *(Segurança)*
**Descrição:** ...

(categorias possíveis: Performance, Segurança, Usabilidade, Escalabilidade, Disponibilidade, Conformidade, Manutenibilidade)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'criterios_aceitacao',
    nome: 'Critérios de aceitação (BDD/Gherkin)',
    agente: 'SCRIBE',
    prompt_template: `Você é SCRIBE, especialista em critérios de aceitação BDD.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente mínimo 3 funcionalidades, cada uma com cenário feliz, cenário de erro e edge case. Use esta estrutura:

# Critérios de Aceitação — {{iteracao_modulo}}

## Funcionalidade: [Nome da Funcionalidade 1]

### Cenário: Fluxo feliz — [descrição]
**Dado que** o usuário está [estado/contexto]
**Quando** ele [realiza ação]
**Então** o sistema [resultado esperado]
**E** [condição adicional se necessário]

### Cenário: Erro — [descrição do erro]
**Dado que** [contexto que provoca erro]
**Quando** ele [realiza ação inválida]
**Então** o sistema exibe [mensagem de erro específica]

### Cenário: Edge case — [descrição]
**Dado que** [condição limite]
**Quando** ele [ação limite]
**Então** o sistema [comportamento esperado no limite]

---

## Funcionalidade: [Nome da Funcionalidade 2]
(repita o padrão acima)
${MARKDOWN_INSTRUCTION}`,
  },

  // =========================================================================
  // ARCH — ARQUITETURA
  // =========================================================================
  {
    tipo_insumo: 'diagrama_contexto',
    nome: 'Diagrama de contexto',
    agente: 'ARCH',
    prompt_template: `Você é ARCH, especialista em Arquitetura de Software.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Gere um Diagrama de Contexto completo. Use esta estrutura:

# Diagrama de Contexto — {{projeto_nome}}

## Visão Geral
Descreva narrativamente a arquitetura e o papel de cada componente principal.

## Diagrama (Mermaid)
\`\`\`mermaid
graph TD
  User[👤 Usuário Final] --> App[Aplicação Web]
  Admin[👤 Administrador] --> App
  App --> DB[(Banco de Dados)]
  App --> Email[Serviço de Email]
  App --> ExtAPI[API Externa]
\`\`\`

## Atores
| Ator | Tipo | Descrição |
|------|------|-----------|
| Usuário Final | Humano | descrição do papel |
| Administrador | Humano | descrição do papel |

## Sistemas Externos
| Sistema | Protocolo | Propósito |
|---------|-----------|-----------|
| Nome do Sistema | REST/HTTPS | para que serve |

## Fronteiras do Sistema
**Dentro do sistema:**
- responsabilidade 1
- responsabilidade 2

**Fora do sistema (dependências externas):**
- dependência 1
- dependência 2
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'modelo_dados',
    nome: 'Modelo de dados',
    agente: 'ARCH',
    prompt_template: `Você é ARCH, especialista em modelagem de dados.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Modele todas as entidades necessárias. Inclua diagrama ER em Mermaid. Use esta estrutura:

# Modelo de Dados — {{iteracao_modulo}}

## Diagrama ER (Mermaid)
\`\`\`mermaid
erDiagram
  ENTIDADE_A ||--o{ ENTIDADE_B : "tem"
  ENTIDADE_B ||--|{ ENTIDADE_C : "contém"
\`\`\`

## Entidades

### [Nome da Entidade] — tabela: nome_da_tabela
**Descrição:** propósito desta entidade no domínio

| Campo | Tipo | PK | Nullable | Descrição |
|-------|------|----|----------|-----------|
| id | uuid | ✓ | não | Identificador único |
| campo_exemplo | varchar(255) | — | não | descrição do campo |
| criado_em | timestamptz | — | não | Data de criação |

**Relacionamentos:**
- 1:N com OutraEntidade via campo_fk
- N:N com OutraEntidade via tabela_pivot

**Índices:** idx_tabela_campo (campo_exemplo)

---

(repita para cada entidade)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'stack',
    nome: 'Stack tecnológico',
    agente: 'ARCH',
    prompt_template: `Você é ARCH, especialista em arquitetura e escolha de tecnologias.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Defina o Stack Tecnológico completo. Adapte todas as escolhas ao contexto do projeto. Use esta estrutura:

# Stack Tecnológico — {{projeto_nome}}

## Frontend
**Tecnologias:** React 19, TypeScript, Tailwind CSS (liste as reais do projeto)
**Justificativa:** por que estas tecnologias são adequadas ao contexto
**Versões principais:** liste as versões relevantes

## Backend
**Tecnologias:** liste as tecnologias
**Justificativa:** justificativa da escolha
**Padrão arquitetural:** ex.: REST API, GraphQL, microserviços

## Banco de Dados
**Tecnologias:** ex.: PostgreSQL, Redis (cache)
**Justificativa:** justificativa da escolha
**Estratégia de migração:** ex.: Flyway / Liquibase / custom

## Infraestrutura e DevOps
**Tecnologias:** ex.: Docker, GitHub Actions, Vercel
**Justificativa:** justificativa da escolha
**Ambientes:** development | staging | production

## Serviços Externos
| Serviço | Propósito | SDK/Protocolo |
|---------|-----------|---------------|
| nome | para que serve | REST/SDK |

## Decisões Arquiteturais (ADRs)
- **ADR-001:** decisão importante e justificativa
- **ADR-002:** decisão importante e justificativa
${MARKDOWN_INSTRUCTION}`,
  },

  // =========================================================================
  // FORGE — CONSTRUÇÃO
  // =========================================================================
  {
    tipo_insumo: 'setup',
    nome: 'Setup do ambiente',
    agente: 'FORGE',
    prompt_template: `Você é FORGE, especialista em setup e configuração de ambientes de desenvolvimento.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente o Setup do Ambiente completo. Use esta estrutura:

# Setup do Ambiente — {{projeto_nome}}

## Pré-requisitos
| Ferramenta | Versão mínima | Link |
|-----------|---------------|------|
| Node.js | >=20.0.0 | https://nodejs.org |
| Docker | >=24.0 | https://docker.com |

## Instalação

\`\`\`bash
git clone <repositório>
cd nome-do-projeto
npm install
cp .env.example .env.local
\`\`\`

## Variáveis de Ambiente
| Variável | Descrição | Exemplo | Obrigatório |
|---------|-----------|---------|-------------|
| DATABASE_URL | Connection string do banco | postgresql://user:pass@localhost:5432/db | ✓ |
| JWT_SECRET | Chave secreta para tokens | secret-key-here | ✓ |

## Comandos Principais
\`\`\`bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build de produção
npm test         # Executa testes
npm run lint     # Verifica código
npm run db:migrate  # Executa migrações
\`\`\`

## Estrutura do Projeto
\`\`\`
src/
├── camada1/     # descrição
├── camada2/     # descrição
└── shared/      # utilitários compartilhados
\`\`\`

## Troubleshooting
- **Problema comum 1:** solução
- **Problema comum 2:** solução
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'implementacao',
    nome: 'Implementação core',
    agente: 'FORGE',
    prompt_template: `Você é FORGE, especialista em desenvolvimento e implementação de software.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente a Implementação Core do módulo. Use esta estrutura:

# Implementação Core — {{iteracao_modulo}}

## Estrutura de Diretórios
\`\`\`
src/
├── modules/
│   └── nome-modulo/
│       ├── controller.ts   # entrada HTTP
│       ├── service.ts      # regras de negócio
│       └── repository.ts   # acesso a dados
└── shared/                 # utilitários
\`\`\`

**Convenções:**
- Arquivos em kebab-case
- Classes em PascalCase
- Funções em camelCase

## Módulos Principais
### [Nome do Módulo]
**Responsabilidade:** o que este módulo faz
**Tecnologias:** tecnologias utilizadas
**Arquivos chave:**
- \`src/modules/nome/service.ts\`
- \`src/modules/nome/repository.ts\`

## Padrões e Convenções
**Arquitetura:** Clean Architecture / Feature Sliced Design / MVC
**Tratamento de erros:** como os erros são capturados e propagados
**Logging:** padrão de logging adotado (ex.: pino, winston)
**Testes:** estratégia por camada (unitário, integração, e2e)

## Fluxo de Dados
\`\`\`
Controller → Service → Repository → Database
\`\`\`
Descreva como os dados fluem e onde cada responsabilidade vive.
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'apis',
    nome: 'Integração de APIs',
    agente: 'FORGE',
    prompt_template: `Você é FORGE, especialista em integração de APIs e serviços externos.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente todas as integrações de API necessárias. Use esta estrutura:

# Integração de APIs — {{iteracao_modulo}}

## [Nome do Serviço/API]
**Base URL:** https://api.exemplo.com/v1
**Autenticação:** Bearer Token | API Key | OAuth2 | mTLS
**Rate limit:** 100 req/min por chave

### Endpoints

#### POST /endpoint
**Descrição:** o que este endpoint faz
**Headers:**
\`\`\`
Content-Type: application/json
Authorization: Bearer {token}
\`\`\`
**Request body:**
\`\`\`json
{ "campo": "valor" }
\`\`\`
**Response (200):**
\`\`\`json
{ "id": "uuid", "status": "ok" }
\`\`\`
**Erros possíveis:** 401 Unauthorized, 422 Unprocessable Entity

---

(repita para cada serviço/API)

## Estratégia de Integração
**Padrão:** REST | GraphQL | gRPC | WebSocket
**Resiliência:** circuit breaker, retry com backoff exponencial, timeout
**Monitoramento:** logs de todas as chamadas, alertas em erros 5xx
**Segredos:** variáveis de ambiente / secret manager (nunca hardcoded)
${MARKDOWN_INSTRUCTION}`,
  },

  // =========================================================================
  // GUARDIAN — QUALIDADE
  // =========================================================================
  {
    tipo_insumo: 'plano_testes',
    nome: 'Plano de testes',
    agente: 'GUARDIAN',
    prompt_template: `Você é GUARDIAN, especialista em qualidade e testes de software.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Elabore um Plano de Testes completo. Inclua mínimo 5 casos de teste críticos. Use esta estrutura:

# Plano de Testes — {{iteracao_modulo}}

## Estratégia
**Abordagem:** descrição geral da abordagem de testes
**Escopo:** o que está dentro e fora do escopo
**Critérios de entrada:** código revisado, ambiente estável, dados de teste preparados
**Critérios de saída:** cobertura mínima atingida, zero bugs críticos abertos
**Riscos:** risco identificado e sua mitigação

## Tipos de Teste
| Tipo | Ferramenta | Cobertura alvo | Foco |
|------|-----------|----------------|------|
| Unitários | Jest / Vitest | 80% | Funções puras, services, utils |
| Integração | Supertest / Playwright | Fluxos críticos | APIs e fluxos entre módulos |
| E2E | Playwright / Cypress | Jornadas principais | Fluxo completo do usuário |
| Performance | k6 / Artillery | P95 < 500ms | Carga esperada em produção |

## Casos de Teste Críticos

### TC-001 — [Nome da funcionalidade]
**Tipo:** unitário | integração | e2e
**Prioridade:** alta | média | baixa
**Descrição:** o que este teste valida
**Passos:**
1. passo 1
2. passo 2
3. passo 3

**Resultado esperado:** o que deve acontecer
**Dados de teste:** dados de entrada usados

---

(repita TC-002, TC-003, TC-004, TC-005...)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'testes_aceitacao',
    nome: 'Testes de aceitação',
    agente: 'GUARDIAN',
    prompt_template: `Você é GUARDIAN, especialista em testes de aceitação BDD.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Documente mínimo 3 funcionalidades, cada uma com cenário feliz, erro e edge case. Use esta estrutura:

# Testes de Aceitação — {{iteracao_modulo}}

## Funcionalidade: [Nome] *(Prioridade: Alta)*

### TA-001: Cenário — Fluxo feliz
**Dado que** o usuário está [estado/contexto específico]
**Quando** ele [realiza ação específica]
**Então** o sistema [resultado mensurável e verificável]
**E** [condição adicional verificável]

### TA-002: Cenário — Erro
**Dado que** [contexto que provoca erro]
**Quando** ele [realiza ação inválida]
**Então** o sistema exibe "[mensagem de erro específica]"

### TA-003: Cenário — Edge case
**Dado que** [condição limite]
**Quando** ele [ação no limite]
**Então** o sistema [comportamento esperado no limite]

---

## Funcionalidade: [Próxima Funcionalidade]
(repita o padrão acima)
${MARKDOWN_INSTRUCTION}`,
  },
  {
    tipo_insumo: 'revisao_seguranca',
    nome: 'Revisão de segurança',
    agente: 'GUARDIAN',
    prompt_template: `Você é GUARDIAN, especialista em segurança de aplicações web e OWASP.
Projeto: {{projeto_nome}}
Módulo/foco: {{iteracao_modulo}}
Contexto adicional: {{contexto}}

Realize uma Revisão de Segurança completa. Use esta estrutura:

# Revisão de Segurança — {{iteracao_modulo}}

## Checklist OWASP Top 10 (2021)
| # | Categoria | Status | Observação |
|---|-----------|--------|------------|
| A01 | Broken Access Control | ✅ ok / ⚠️ atenção / 🔴 crítico | análise e mitigações |
| A02 | Cryptographic Failures | ✅/⚠️/🔴 | ... |
| A03 | Injection | ✅/⚠️/🔴 | ... |
| A04 | Insecure Design | ✅/⚠️/🔴 | ... |
| A05 | Security Misconfiguration | ✅/⚠️/🔴 | ... |
| A06 | Vulnerable Components | ✅/⚠️/🔴 | ... |
| A07 | Authentication Failures | ✅/⚠️/🔴 | ... |
| A08 | Software Integrity Failures | ✅/⚠️/🔴 | ... |
| A09 | Security Logging Failures | ✅/⚠️/🔴 | ... |
| A10 | SSRF | ✅/⚠️/🔴 | ... |

## Vulnerabilidades Identificadas

### VUL-001 — [Tipo de Vulnerabilidade]
**Severidade:** crítica | alta | média | baixa
**Componente afetado:** nome do componente
**Descrição:** descrição detalhada da vulnerabilidade
**Mitigação:** como corrigir ou mitigar

---

(repita para cada vulnerabilidade)

## Conformidade LGPD
**Dados pessoais coletados:** Nome, Email, CPF (se aplicável)
**Base legal:** Consentimento | Execução de contrato | Legítimo interesse
**Medidas de proteção:**
- criptografia em repouso e em trânsito
- pseudonimização e minimização de dados
- controle de acesso por perfil

**Direitos dos titulares:** como são garantidos acesso, retificação, exclusão e portabilidade

## Recomendações
**Imediatas (esta sprint):**
- ação urgente 1
- ação urgente 2

**Curto prazo (próximas 2 sprints):**
- ação 1

**Longo prazo (roadmap):**
- ação estratégica 1
${MARKDOWN_INSTRUCTION}`,
  },
]

/** Retorna template por tipo_insumo ou undefined */
export function getTemplateByTipo(tipo_insumo: string): ConfiguracaoTemplate | undefined {
  return CONFIGURACOES_TEMPLATES.find((t) => t.tipo_insumo === tipo_insumo)
}

/** @deprecated Use CONFIGURACOES_TEMPLATES instead */
export const DEFINICOES_TEMPLATES = CONFIGURACOES_TEMPLATES

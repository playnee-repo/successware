# Product Roadmap — SDLC Copilot para Todos os Perfis

**Objetivo:** Tornar o produto utilizável por engenheiros de software, devs e vibe coders — com onboarding guiado, progresso visível e um copiloto proativo que indica o que fazer a seguir.

**Perfis alvo:**
- **Engenheiro** — quer processo completo, artefatos detalhados, controle total
- **Dev** — quer geração rápida, menos burocracia, iteração veloz
- **Vibe coder** — descreve a ideia, a IA faz o resto, zero jargão

---

## Visão geral das fases

```
Fase 1 — Progresso visível       (Dashboard + cards de projeto)
Fase 2 — Onboarding zero-friction (primeiro uso guiado por IA)
Fase 3 — Guided experience        (próximo passo sempre claro)
Fase 4 — Templates por tipo       (startup, SaaS, app, interno)
Fase 5 — ADVISOR overlay          (copiloto proativo flutuante)
```

---

## Fase 1 — Progresso visível no Dashboard

### Task 1.1: Migration — campo `tipo` em projetos

**File:** `supabase/migrations/018_projeto_tipo.sql`

```sql
alter table projetos
  add column if not exists tipo text
    check (tipo in ('startup_mvp', 'saas', 'app_mobile', 'api', 'sistema_interno', 'outro'))
    default 'outro',
  add column if not exists contexto_ia text; -- resumo livre para o ADVISOR
```

**Commit:** `feat(db): campo tipo e contexto_ia em projetos`

---

### Task 1.2: Atualizar tipos TypeScript

**File:** `src/shared/api/supabase.ts`

Adicionar em `projetos.Row`:
```typescript
tipo: 'startup_mvp' | 'saas' | 'app_mobile' | 'api' | 'sistema_interno' | 'outro' | null
contexto_ia: string | null
```
E tornar `tipo` e `contexto_ia` opcionais no `Insert`.

**File:** `src/entities/project/model/types.ts`

Adicionar `tipo` e `contexto_ia` ao tipo `Project`.

**Commit:** `feat(types): tipo e contexto_ia em Project`

---

### Task 1.3: Gauge de progresso global — query cross-disciplinas

**File:** `supabase/migrations/019_progresso_projeto.sql`

```sql
-- Função que retorna progresso por disciplina para um projeto
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
```

**Commit:** `feat(db): função progresso_projeto cross-disciplinas`

---

### Task 1.4: Hook de progresso + gauge nos cards do Dashboard

**File:** `src/entities/project/model/useProjectProgress.ts` *(criar)*

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/api/supabase'

export interface DisciplinaProgresso {
  disciplina: string
  total_artefatos: number
  aprovados: number
  progresso: number
}

export function useProjectProgress(projectId: string) {
  return useQuery({
    queryKey: ['progresso-projeto', projectId],
    queryFn: async (): Promise<DisciplinaProgresso[]> => {
      const { data, error } = await supabase
        .rpc('progresso_projeto', { p_projeto_id: projectId })
      if (error) throw error
      return data as DisciplinaProgresso[]
    },
    enabled: !!projectId,
  })
}

export function calcularProgressoGlobal(disciplinas: DisciplinaProgresso[]): number {
  const comAtividade = disciplinas.filter(d => d.total_artefatos > 0)
  if (!comAtividade.length) return 0
  const soma = comAtividade.reduce((acc, d) => acc + d.progresso, 0)
  return Math.round(soma / comAtividade.length)
}
```

**File:** `src/pages/dashboard/ui/DashboardPage.tsx` *(modificar)*

No `ProjectCard`, buscar `useProjectProgress(project.id)` e exibir:
- Barra de progresso global (% geral)
- Mini badges por disciplina com cor (cinza=vazio, amarelo=em andamento, verde=completa)

Estrutura visual no card:
```
[████████░░░░] 65%   D R A C Q
                     ●●●○○
```
Onde `D R A C Q` = Descoberta, Requisitos, Arquitetura, Construção, Qualidade
- verde = ≥80%, amarelo = 1-79%, cinza = 0%

**Commit:** `feat(dashboard): gauge de progresso global e badges por disciplina nos cards`

---

## Fase 2 — Onboarding zero-friction

### Task 2.1: Tela de onboarding "descreva sua ideia"

**File:** `src/pages/dashboard/ui/DashboardPage.tsx` *(modificar)*

Quando `projects.length === 0`, ao invés do empty state atual mostrar um **wizard de criação**:

```
┌─────────────────────────────────────┐
│  Bem-vindo ao SDLC Copilot          │
│                                     │
│  Descreva sua ideia em uma frase:   │
│  ┌─────────────────────────────┐    │
│  │ Um app de gestão de tarefas │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tipo do projeto:                   │
│  ○ Startup MVP  ○ SaaS  ○ App       │
│  ○ API  ○ Sistema interno           │
│                                     │
│  [Criar projeto com IA →]           │
└─────────────────────────────────────┘
```

**Lógica:** ao submeter, chama Gemini para gerar `nome`, `descricao` e `contexto_ia` a partir da ideia livre. Cria o projeto + primeira iteração automaticamente. Redireciona para `/project/:id/requisitos`.

**File:** `src/features/onboarding/model/useOnboarding.ts` *(criar)*

```typescript
// Chama Gemini para estruturar a ideia do usuário
async function estruturarIdeia(ideia: string, tipo: string): Promise<{
  nome: string
  descricao: string
  contexto_ia: string
  iteracao_nome: string
}> { ... }
```

**Commit:** `feat(onboarding): wizard de criação guiada por IA para novo usuário`

---

### Task 2.2: Seletor de tipo no dialog de novo projeto

**File:** `src/pages/dashboard/ui/DashboardPage.tsx` *(modificar)*

No dialog "Novo Projeto" existente, adicionar após o campo "Descrição":

```tsx
<Select value={tipo} onValueChange={setTipo}>
  <SelectItem value="startup_mvp">🚀 Startup MVP</SelectItem>
  <SelectItem value="saas">☁️ SaaS</SelectItem>
  <SelectItem value="app_mobile">📱 App Mobile</SelectItem>
  <SelectItem value="api">⚡ API / Backend</SelectItem>
  <SelectItem value="sistema_interno">🏢 Sistema Interno</SelectItem>
  <SelectItem value="outro">✨ Outro</SelectItem>
</Select>
```

Salvar `tipo` no insert do projeto.

**Commit:** `feat(dashboard): seletor de tipo de projeto no cadastro`

---

## Fase 3 — Guided experience dentro do projeto

### Task 3.1: Badges de progresso nas disciplinas do sidebar

**File:** `src/widgets/sidebar/ui/Sidebar.tsx` *(modificar)*

Buscar `useProjectProgress(projectId)` e em cada item de disciplina mostrar:
- Nenhum artefato → sem badge
- Tem artefatos, progresso < 80% → badge amarelo com `%`
- Progresso ≥ 80% → badge verde com `✓`

**Commit:** `feat(sidebar): badges de progresso por disciplina`

---

### Task 3.2: Banner "próximo passo" no ProjectPage

**File:** `src/pages/project/ui/ProjectPage.tsx` *(modificar)*

Um banner contextual no topo da área de conteúdo (abaixo do Header) que mostra a sugestão de próxima ação:

```
┌──────────────────────────────────────────────────────┐
│ 💡 Próximo passo sugerido                        [×] │
│ Você tem 2 atividades sem artefatos em Requisitos.   │
│ Comece por "User Stories" para estruturar o escopo.  │
│                              [Ir para User Stories →]│
└──────────────────────────────────────────────────────┘
```

**Lógica:** baseado no progresso local (sem chamar IA), identifica a disciplina com mais atividades em aberto e a primeira atividade sem artefatos.

**File:** `src/features/next-step/model/useNextStep.ts` *(criar)*

```typescript
// Lógica pura, sem IA: identifica próximo passo com base no progresso
export function calcularProximoPasso(
  atividades: AtividadeComProgresso[],
  disciplinaAtual: string
): ProximoPasso | null { ... }
```

**Commit:** `feat(project): banner de próximo passo contextual`

---

### Task 3.3: Empty state por disciplina com call-to-action

**File:** `src/widgets/activity-grid/ui/ActivityGrid.tsx` *(modificar)*

Quando uma disciplina não tem nenhum artefato, mostrar:
```
┌────────────────────────────────────────┐
│                                        │
│  📄  Nenhum artefato ainda             │
│                                        │
│  Clique em "Novo Artefato" em qualquer │
│  atividade para começar.               │
│                                        │
│  [▶ Gerar primeiro artefato com IA]   │
└────────────────────────────────────────┘
```

**Commit:** `feat(activity-grid): empty state com CTA por disciplina`

---

## Fase 4 — Templates por tipo de projeto

### Task 4.1: Sistema de templates de configuração

**File:** `supabase/migrations/020_templates_projeto.sql`

Adicionar coluna `tipos_projeto` em `configuracoes_atividade`:

```sql
alter table configuracoes_atividade
  add column if not exists tipos_projeto text[] default '{}';
-- Ex: '{startup_mvp, saas}' = visível só para esses tipos
-- Array vazio = visível para todos
```

**Commit:** `feat(db): tipos_projeto em configuracoes_atividade para filtragem`

---

### Task 4.2: Seed de templates por tipo

**File:** `supabase/seed.sql` *(modificar)*

Atualizar os `configuracoes_atividade` existentes com `tipos_projeto`:
- Configurações de Briefing, User Stories → `'{startup_mvp, saas, app_mobile, outro}'`
- Configurações de Arquitetura detalhada → `'{saas, sistema_interno, api}'`
- Configurações lean/rápidas → `'{startup_mvp}'`

**Commit:** `feat(db): seed de tipos_projeto nas configurações existentes`

---

### Task 4.3: Filtrar atividades por tipo do projeto

**File:** `src/features/manage-artifacts/model/useArtifacts.ts` *(modificar)*

Na query `useAtividadesComProgresso`, filtrar `configuracoes_atividade` pelo `tipo` do projeto:
```typescript
// Se projeto.tipo !== null, filtra configs onde tipos_projeto @> [projeto.tipo] OR tipos_projeto = '{}'
```

**Commit:** `feat(artifacts): filtrar configurações de atividade pelo tipo do projeto`

---

## Fase 5 — ADVISOR overlay (copiloto proativo)

### Task 5.1: Agente ADVISOR no banco

**File:** `supabase/seed.sql` *(modificar)*

Adicionar em `agentes_config`:
```sql
insert into agentes_config (id, nome, descricao, system_prompt, modelo, temperatura, ativo)
values (
  'ADVISOR',
  'ADVISOR',
  'Copiloto proativo que analisa o estado do projeto e recomenda próximas ações',
  '-- system prompt do ADVISOR --',
  'gemini-1.5-flash',
  0.3,
  true
);
```

**System prompt do ADVISOR:**
```
Você é o ADVISOR, um copiloto de desenvolvimento de software.
Analise o estado atual do projeto e forneça UMA recomendação concisa e acionável.
Considere: tipo do projeto, disciplinas em andamento, artefatos aprovados e gaps.
Responda em JSON: { "titulo": "...", "mensagem": "...", "acao": "...", "rota": "..." }
Seja direto. Máximo 2 frases na mensagem. Tom: parceiro experiente, não formal.
```

**Commit:** `feat(db): agente ADVISOR no seed`

---

### Task 5.2: Hook do ADVISOR

**File:** `src/features/advisor/model/useAdvisor.ts` *(criar)*

```typescript
interface AdvisorRecomendacao {
  titulo: string
  mensagem: string
  acao: string
  rota: string
}

export function useAdvisor(projeto: Project, progressoDisciplinas: DisciplinaProgresso[]) {
  // Throttle: só chama IA a cada 5 minutos ou quando progresso muda
  // Monta contexto: tipo do projeto + progresso por disciplina + iteração ativa
  // Chama Gemini com system prompt do ADVISOR
  // Retorna recomendação parseada
}
```

**Commit:** `feat(advisor): hook useAdvisor com chamada ao ADVISOR agent`

---

### Task 5.3: Widget floating ADVISOR

**File:** `src/widgets/advisor/ui/AdvisorWidget.tsx` *(criar)*

Widget fixo no canto inferior direito da tela, presente em todas as rotas protegidas:

```
                    ┌─────────────────────────────┐
                    │ 💡 ADVISOR                  │
                    │                             │
                    │ Você ainda não tem critérios│
                    │ de aceitação aprovados.     │
                    │ Isso pode gerar retrabalho  │
                    │ na fase de construção.      │
                    │                             │
                    │ [→ Ir para Requisitos]      │
                    └─────────────────────────────┘
                                          [●] ADVISOR
```

- Estado colapsado: só o botão `[● ADVISOR]`
- Estado expandido: card com recomendação + botão de ação
- Auto-expande quando há recomendação nova (uma vez por sessão)
- Dismiss: fecha até próxima mudança de progresso

**File:** `src/app/providers/index.tsx` *(modificar)*

Adicionar `<AdvisorWidget />` dentro do layout global.

**Commit:** `feat(advisor): widget floating do copiloto proativo`

---

### Task 5.4: Análise qualitativa — atividades relevantes por tipo

**File:** `src/features/advisor/model/useRelevanciaAtividades.ts` *(criar)*

```typescript
// Dado o tipo do projeto e as atividades, retorna quais são "essenciais",
// "recomendadas" e "opcionais" para esse perfil
export function useRelevanciaAtividades(
  tipo: string,
  atividades: AtividadeComProgresso[]
): { essencial: string[]; recomendada: string[]; opcional: string[] }
```

Implementação inicial: tabela estática por tipo (sem IA). Depois substituir por chamada ao ADVISOR.

**File:** `src/widgets/activity-grid/ui/ActivityCard.tsx` *(modificar)*

Mostrar badge de relevância no card de atividade:
- `ESSENCIAL` → borda verde sutil
- `OPCIONAL` → texto levemente opaco com `(opcional)` ao lado do nome

**Commit:** `feat(advisor): relevância de atividades por tipo de projeto`

---

## Resumo de arquivos

| Arquivo | Ação | Fase |
|---------|------|------|
| `supabase/migrations/018_projeto_tipo.sql` | Criar | 1 |
| `supabase/migrations/019_progresso_projeto.sql` | Criar | 1 |
| `supabase/migrations/020_templates_projeto.sql` | Criar | 4 |
| `src/shared/api/supabase.ts` | Modificar | 1 |
| `src/entities/project/model/types.ts` | Modificar | 1 |
| `src/entities/project/model/useProjectProgress.ts` | Criar | 1 |
| `src/features/onboarding/model/useOnboarding.ts` | Criar | 2 |
| `src/features/next-step/model/useNextStep.ts` | Criar | 3 |
| `src/features/advisor/model/useAdvisor.ts` | Criar | 5 |
| `src/features/advisor/model/useRelevanciaAtividades.ts` | Criar | 5 |
| `src/pages/dashboard/ui/DashboardPage.tsx` | Modificar | 1, 2 |
| `src/pages/project/ui/ProjectPage.tsx` | Modificar | 3 |
| `src/widgets/sidebar/ui/Sidebar.tsx` | Modificar | 3 |
| `src/widgets/activity-grid/ui/ActivityGrid.tsx` | Modificar | 3 |
| `src/widgets/advisor/ui/AdvisorWidget.tsx` | Criar | 5 |
| `src/app/providers/index.tsx` | Modificar | 5 |
| `supabase/seed.sql` | Modificar | 4, 5 |

---

## Ordem de implementação recomendada

```
Fase 1 (2-3h) → Fase 2 (2h) → Fase 3 (2h) → Fase 4 (1h) → Fase 5 (3h)
Total estimado: ~10h de desenvolvimento
```

Cada fase é independente e deployável — o produto melhora a cada entrega.

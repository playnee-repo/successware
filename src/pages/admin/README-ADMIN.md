# Admin — Disciplinas, Atividades e Definições de Insumo

## Hierarquia

- **Disciplina**: agrupa N atividades (ex.: DESCOBERTA, ENG. REQUISITOS).
- **Atividade**: pertence a uma disciplina; tem nome, descrição, agente, ordem (ex.: Briefing Inicial, User Stories).
- **Definição de insumo**: template vinculado a uma atividade (tipo, schema JSON, prompt para a IA). Uma atividade pode ter uma ou mais definições.

No banco: `atividades` (por disciplina), `definicoes_insumos` (por atividade). Os **insumos do projeto** (`insumos_projeto`) são as instâncias por iteração e não são editados no admin.

---

## CRUD no Admin (um lugar por ação)

### 1. Disciplinas e atividades (aba “Disciplinas”)

| Ação | Onde |
|------|------|
| **Criar atividade** | Apenas **“Adicionar atividade”** no bloco da disciplina (evita dois lugares). |
| **Editar atividade** | Ícone de lápis na linha da atividade. |
| **Excluir atividade** | Ícone de lixeira na linha. |
| **Abrir definição de insumo da atividade** | Ícone de documento na linha → vai para aba “Definições de insumo” com a atividade já selecionada. |
| **Criar nova disciplina** | Apenas botão **“Nova disciplina”** no final da página. |

### 2. Definições de insumo (aba “Definições de insumo”)

| Ação | Onde |
|------|------|
| **Criar definição** | Apenas **“Nova definição”** (com uma atividade selecionada na lista). |
| **Editar definição** | Selecionar atividade → abas por definição → editor à direita (tipo, agente, schema, prompt) → Salvar. |
| **Excluir definição** | Ícone de lixeira no cabeçalho do editor. |

---

## Código

- Hooks: `useAdminAtividades`, `useAdminDefinicoes`.
- UI: `AdminPage.tsx` — `SecaoAtividades` (disciplinas + atividades), `SecaoDefinicoes` (definições por atividade), `AtividadeDialog`, `DefinicaoEditor`, `DeleteDialog`.

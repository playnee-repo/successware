# Setup Supabase: Local + Produção

Guia para configurar o projeto SDLC Copilot com Supabase, trabalhando localmente e fazendo deploy em produção.

## Visão geral

| Ambiente | URL Supabase | Quando usar |
|----------|--------------|-------------|
| **Local** | `http://127.0.0.1:54321` | Desenvolvimento diário |
| **Produção** | `https://<project-ref>.supabase.co` | App em produção |

O mesmo código usa variáveis de ambiente diferentes em cada caso.

---

## 1. Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para Supabase local)
- Conta no [Supabase](https://supabase.com/dashboard)

---

## 2. Linkar ao projeto Supabase (produção)

Se você já criou um projeto no Supabase Dashboard e quer conectá-lo:

### 2.1. Fazer login no CLI

```powershell
npx supabase login
```

### 2.2. Linkar o projeto

O **project-ref** está na URL do seu projeto:
`https://app.supabase.com/dashboard/project/<project-ref>`

```powershell
npx supabase link --project-ref <SEU-PROJECT-REF>
```

Exemplo: `npx supabase link --project-ref abcdefghijklmnop`

### 2.3. Sincronizar schema (se o remoto já tem dados)

Se você criou tabelas direto no Dashboard antes de usar migrations:

```powershell
# Puxar schema do remoto para migrations locais
npx supabase db pull

# Aplicar no local
npx supabase db reset
```

---

## 3. Desenvolvimento local

### 3.1. Iniciar Supabase local

```powershell
npx supabase start
```

Isso sobe Postgres, Auth, Storage, etc. em containers Docker. Ao final, o CLI mostra:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJ...
```

### 3.2. Configurar .env.local

```powershell
copy .env.example .env.local
```

Edite `.env.local` com as credenciais **locais**:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key do "supabase start">
```

### 3.3. Aplicar migrations e seed

```powershell
npx supabase db reset
```

Isso aplica todas as migrations em `supabase/migrations/` e roda `supabase/seed.sql`.

### 3.4. Rodar o app

```powershell
npm run dev
```

Acesse: http://localhost:5173

### 3.5. Parar Supabase local

```powershell
npx supabase stop
```

---

## 4. Deploy para produção

### 4.1. Enviar migrations

Depois de testar localmente:

```powershell
npx supabase db push
```

Isso aplica as migrations pendentes no banco remoto.

### 4.2. Configurar variáveis em produção

No seu provedor de deploy (Vercel, Netlify, etc.) ou no build de produção, defina:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key do projeto (Settings > API) |

---

## 5. Seeds (dados iniciais)

### Local

O `supabase/seed.sql` é executado **automaticamente** quando você roda:

```powershell
npx supabase db reset
```

Ele popula: empresa demo, atividades, configurações de atividade, agentes, etc.

### Produção

**Importante:** O `db push` envia apenas **migrations** (schema). Seeds **não** são aplicados automaticamente em produção — isso evita sobrescrever dados reais.

Para popular o banco de produção pela primeira vez:

1. Abra o [Supabase Dashboard](https://app.supabase.com/dashboard) → seu projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/seed.sql` e execute

### Seeds parciais

O arquivo `supabase/seed-definicoes-only.sql` contém apenas inserts em `configuracoes_atividade`. Use para atualizar definições sem rodar o seed completo.

**Local:** Abra o Supabase Studio local (http://127.0.0.1:54323) → SQL Editor → cole e execute o conteúdo do arquivo.

**Produção:** SQL Editor no Dashboard do Supabase → cole e execute.

### Múltiplos arquivos de seed

Para organizar seeds em vários arquivos, configure em `supabase/config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = ['./seed.sql', './seed-definicoes-only.sql']
```

---

## 6. Fluxo de trabalho recomendado

```
1. Desenvolver localmente
   npx supabase start
   npm run dev

2. Criar/modificar schema
   - Editar supabase/migrations/ ou usar supabase db diff
   - npx supabase db reset (testar local)

3. Deploy
   npx supabase db push
   (deploy do frontend no seu provedor)
```

---

## 7. Comandos úteis

| Comando | Descrição |
|---------|------------|
| `npx supabase start` | Inicia stack local |
| `npx supabase stop` | Para stack local |
| `npx supabase status` | Mostra URLs e chaves |
| `npx supabase db reset` | Reseta DB local (migrations + seed) |
| `npx supabase db push` | Envia migrations para produção |
| `npx supabase db pull` | Puxa schema do remoto |
| `npx supabase migration new <nome>` | Cria nova migration |

---

## 8. Troubleshooting

### Docker não encontrado

`supabase start` precisa do Docker. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e garanta que está rodando.

### "Missing Supabase environment variables"

Crie `.env.local` a partir de `.env.example` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### Migrations conflitantes

Se local e remoto divergiram:

```powershell
npx supabase db pull   # Puxa estado do remoto
# Revise o arquivo gerado em supabase/migrations/
npx supabase db reset # Aplica localmente
```

### Resetar projeto linkado

```powershell
npx supabase unlink
npx supabase link --project-ref <novo-project-ref>
```

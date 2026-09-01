# DOC Intelligence — API (Trilha A · Back-end)

Fatia vertical da API do serviço de inteligência documental do escritório Lamarck Advogados, desenvolvida com **NestJS**, **Prisma**, **PostgreSQL** e **BullMQ** (fila com Redis) para processamento assíncrono.

Projeto desenvolvido como resposta à prova técnica de seleção — Trilha A (Back-end). A especificação completa e as decisões de arquitetura estão documentadas em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Sumário

- [Pré-requisitos](#-pré-requisitos)
- [Como rodar o projeto localmente](#-como-rodar-o-projeto-localmente)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)
- [Testes](#-testes)
- [Documentação do projeto](#-documentação-do-projeto)

---

## 🛠 Pré-requisitos

- **Node.js** versão 24.20.0 ou superior
- **Docker** e **Docker Compose**
- **Git**

---

## 🚀 Como rodar o projeto localmente

### 1. Clone o repositório
```bash
git clone https://github.com/erikmaia15/DOC-Intelligence.git
cd doc-intelligence
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
```env
# URL de conexão do banco
DATABASE_URL="postgresql://doc_intelligence:doc_intelligence@localhost:5433/doc_intelligence?schema=public"

# Redis — usado pelo BullMQ
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Configuração da IA mockada (StubAiAdapter)
STUB_AI_CONFIDENCE=0.95

# Aplicação
PORT=3000
NODE_ENV=development
```

### 4. Suba a infraestrutura (PostgreSQL e Redis)
```bash
cd db
docker compose up -d
cd ..
```

### 5. Sincronize o banco de dados (Prisma)
Aplica as migrations versionadas em `prisma/migrations/`:
```bash
npx prisma migrate dev
```

### 6. Inicie a aplicação
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

---

## 📚 Documentação da API (Swagger)

Com a aplicação rodando, o contrato interativo completo da API está disponível em:

**http://localhost:3000/api-docs**

---

## 🧪 Testes

Para rodar a suíte de testes:
```bash
npm run test
```

### O que foi escolhido testar, e por quê

Dado o prazo da prova, a estratégia de testes unitários (Vitest — ver nota abaixo) evitou cobertura ampla de CRUD e focou nos quatro cenários que protegem as regras de negócio centrais e mitigam os fatos do ambiente mapeados em `docs/ARCHITECTURE.md`:

| # | Cenário | Fato do ambiente coberto |
|---|---|---|
| 1 | **Deduplicação por hash** — o mesmo documento não é reprocessado nem regravado em disco quando reenviado | Fato (c) — reenvio por insegurança/precaução |
| 2 | **Roteamento de confiança** — score abaixo do limite envia o documento para `NEEDS_REVIEW` em vez de `READY` | Comportamento-alvo #4 do produto |
| 3 | **Concorrência na fila de revisão** — `ReviewService` retorna `409 Conflict` ao tentar reivindicar um documento já travado por outro revisor | Fato (g) — dois revisores simultâneos |
| 4 | **Retry do worker** — falhas da IA acionam retentativas do BullMQ e, ao esgotar o limite, o documento é roteado para `FAILED` sem derrubar a aplicação | Fato (a) — instabilidade do provedor de IA |

> **Nota sobre o framework de testes:** o projeto usa Vitest, não Jest como originalmente registrado em `docs/ARCHITECTURE.md`. Essa divergência entre especificação e implementação, junto com a justificativa de mantê-la, está documentada em [`docs/DIVERGENCIAS.md`](docs/DIVERGENCIAS.md).

---

## 📄 Documentação do projeto

| Arquivo | Conteúdo |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Especificação, decisões de arquitetura e ADRs |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Escopo da fatia vertical — o que entra e o que fica de fora, e por quê |
| [`docs/NESTJS-BEST-PRACTICES.md`](docs/NESTJS-BEST-PRACTICES.md) | Convenções de código adotadas no projeto |
| [`docs/DIVERGENCIAS.md`](docs/DIVERGENCIAS.md) | Divergências entre especificação e implementação |
| [`AGENTS.md`](AGENTS.md) | Instruções usadas para condução do agente de IA |
| [`prompts/`](prompts/) | Prompts utilizados durante o desenvolvimento, em ordem cronológica |
| [`PROGRESSO.md`](PROGRESSO.md) | Log de testes manuais, bugs encontrados e decisões da sessão |

# Progresso e Próximos Passos — DOC Intelligence

> Log de continuidade da sessão de planejamento/execução. Complementa `docs/PROXIMOS-PASSOS.md` (checklist geral dos 5 itens da entrega) com o estado real do projeto até agora.

---

## 1. Estado atual (30/08/2026, ~20h)

- ✅ Repositório criado, estrutura de pastas conforme `AGENTS.md` (`docs/`, `prompts/`, `prisma/`, `db/` para o compose)
- ✅ Scaffold NestJS gerado (CJS + Jest — decisão registrada, ver seção 3)
- ✅ `docker-compose.yml` (Postgres + Redis) em `db/docker-compose.yml`, containers rodando
- ✅ `.env` configurado
- ✅ Prisma instalado (`prisma` + `@prisma/client`)
- ✅ `schema.prisma` com o modelo de `ARCHITECTURE.md` seção 3 aplicado
- ✅ `prisma migrate dev` executado — migration inicial versionada em `prisma/migrations/`
- ✅ `prisma generate` executado
- ✅ App sobe sem erros (`Nest application successfully started`)
- ✅ **PrismaModule / PrismaService**: Configuração global injetando PrismaClient.
- ✅ **ConfigModule**: Validação fail-fast via Joi (`DATABASE_URL`, `REDIS_HOST`, etc.).
- ✅ **ValidationPipe**: Global em `main.ts` com proteção rigorosa para payloads inesperados.

**Ainda não iniciado:** módulos de negócio (`Documents`, `Processing`, `Ai`, `Review`).

---

## 2. Prazo confirmado

- Documento emitido em 25/08/2026, **recebido em 30/08/2026**.
- **Prazo real: até 01/09/2026** — restam efetivamente ~2 dias corridos a partir de hoje.
- Plano de corte em caso de aperto (ordem de prioridade a manter): upload + dedupe + consulta **nunca corta**; se faltar tempo, cortar nesta ordem: testes automatizados → fila de conferência (fica só especificada em `ARCHITECTURE.md`, não implementada) → retry sofisticado do worker (vira retry simples).

---

## 3. Decisões tomadas nesta sessão (além do que já está em `docs/ARCHITECTURE.md`)

| Decisão | Escolha | Motivo |
|---|---|---|
| Sistema de módulos do Nest | **CommonJS (CJS) + Jest** | Mais maduro/estável no ecossistema Nest do que ESM+Vitest; time não deve ser gasto debugando configuração de módulo. |
| Localização da documentação | `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/NESTJS-BEST-PRACTICES.md`, `docs/PROXIMOS-PASSOS.md` | `AGENTS.md` fica na **raiz** (convenção de ferramentas de agente); os demais em `docs/` para não poluir a raiz. |
| Localização do docker-compose | `db/docker-compose.yml` (não na raiz) | Organização escolhida pelo candidato; comando de subida ajustado para `docker compose -f db/docker-compose.yml up -d`. |

> ⚠️ Se o `AGENTS.md` ainda referencia os arquivos de docs sem o prefixo `docs/`, corrigir os caminhos nas seções 2 e 6 dele antes de seguir — o agente precisa achar os arquivos certos.

---

## 4. Próximos passos imediatos (nesta ordem)

1. ✅ **`PrismaModule` / `PrismaService`** — provider único injetável, nenhum outro módulo deve instanciar `PrismaClient` diretamente.
2. ✅ **`ConfigModule`** com validação de schema (Joi/Zod) — app não sobe sem `DATABASE_URL`/`REDIS_HOST`/`REDIS_PORT`.
3. ✅ **`ValidationPipe` global** no `main.ts` (`whitelist: true, forbidNonWhitelisted: true`).
4. **`DocumentsModule`** — prioridade 1 do plano de implementação:
   - `POST /documents` com validação de tipo/tamanho
   - cálculo de hash (SHA-256) e checagem de duplicata **antes** de qualquer persistência/enfileiramento
   - `GET /documents` e `GET /documents/:id`
5. **`AiModule`** (`AiPort` + `StubAiAdapter`)
6. **`ProcessingModule`** (BullMQ worker + retry/backoff)
7. **`ReviewModule`** (claim + correct) — primeiro candidato a corte se o prazo apertar
8. Testes dos 4 cenários de `docs/FEATURES.md` seção 4 — se sobrar tempo
9. `README.md` do projeto, revisão de commits, prompts salvos, carta de fechamento

---

## 5. Lembretes operacionais

- **Commits:** um por unidade lógica, Conventional Commits, mensagem revisada antes de aceitar (ver `AGENTS.md` seção 4).
- **Prompts:** salvar em `prompts/NN-descricao.md`, em ordem, como escritos originalmente — inclusive prompts "pequenos" como a escolha CJS/Jest, já que contam como decisão registrada.
- **Nunca implementar o que está em "fica FORA" de `docs/FEATURES.md`** sem decisão explícita de trocar prioridade.
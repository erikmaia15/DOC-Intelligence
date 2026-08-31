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
- ✅ **DocumentsModule**: Upload de arquivos validando mimeType e maxSizeBytes, deduplicação garantida por hash (Fato C), persistência usando o nome do arquivo original (resolvendo problemas de codificação latin1) e retorno via controller limpo e focado.

- ✅ **AiModule**: Interface `AiPort` e `StubAiAdapter` implementados para desacoplar provedor de IA (Fato f).
- ✅ **ProcessingModule**: Fila assíncrona (BullMQ) para processamento em background (Fato a), com retry backoff exponencial e roteamento inteligente por confiabilidade.
- ✅ **ReviewModule**: Fila de conferência manual (Fato g) com trava por TTL (claim) e tratamento de concorrência usando exceções semânticas.

**Ainda não iniciado:** testes automatizados, limpeza de commits, e arquivo final `README.md`.

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

## Testes manuais realizados — DocumentsModule

- Upload válido → 201, Document criado com status PENDING ✅
- Reenvio do mesmo arquivo → inicialmente criava duplicata (bug: dedupe checava só na resposta, não antes de persistir) → corrigido, agora retorna o mesmo id ✅
- Upload de tipo inválido → 400 com corpo consistente (bug anterior: 201 com corpo de erro 400, corrigido) ✅
- Encoding de nome de arquivo com acento → estava quebrado (latin1 vs utf-8), corrigido ✅
- storageKey expondo caminho absoluto da máquina local → corrigido para caminho relativo ✅
- GET /documents e GET /documents/:id → funcionando ✅

---

## Testes manuais realizados — ProcessingModule

- Upload novo → PENDING → PROCESSING → READY (~2s), ExtractionResult populado ✅
- STUB_AI_CONFIDENCE=0.5 → NEEDS_REVIEW confirmado ✅ (bug encontrado: valor do .env não era aplicado sem reiniciar o processo — corrigido/confirmado reiniciando o app)
- Falha simulada → FAILED: não testado [ou testar rapidamente se sobrar tempo] ⚠️

---

## 4. Próximos passos imediatos (nesta ordem)

1. ✅ **`PrismaModule` / `PrismaService`** — provider único injetável, nenhum outro módulo deve instanciar `PrismaClient` diretamente.
2. ✅ **`ConfigModule`** com validação de schema (Joi/Zod) — app não sobe sem `DATABASE_URL`/`REDIS_HOST`/`REDIS_PORT`.
3. ✅ **`ValidationPipe` global** no `main.ts` (`whitelist: true, forbidNonWhitelisted: true`).
4. ✅ **`DocumentsModule`** — concluído e testado.
5. ✅ **`AiModule`** (`AiPort` + `StubAiAdapter`) — concluído.
6. ✅ **`ProcessingModule`** (BullMQ worker + retry/backoff) — concluído e testado.
7. ✅ **`ReviewModule`** (claim + correct) — concluído.
8. Testes dos 4 cenários de `docs/FEATURES.md` seção 4 — se sobrar tempo
9. `README.md` do projeto, revisão de commits, prompts salvos, carta de fechamento

---

## 5. Lembretes operacionais

- **Commits:** um por unidade lógica, Conventional Commits, mensagem revisada antes de aceitar (ver `AGENTS.md` seção 4).
- **Prompts:** salvar em `prompts/NN-descricao.md`, em ordem, como escritos originalmente — inclusive prompts "pequenos" como a escolha CJS/Jest, já que contam como decisão registrada.
- **Nunca implementar o que está em "fica FORA" de `docs/FEATURES.md`** sem decisão explícita de trocar prioridade.
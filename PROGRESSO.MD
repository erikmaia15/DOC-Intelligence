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
- ✅ **Testes Automatizados**: Suítes criadas usando Vitest, com PrismaService mockado limpo, validando concorrência (claim), retentativas/falha (worker) e deduplicação (Fato c).
- ✅ **Documentação da API (Swagger)**: Contrato OpenAPI configurado no `main.ts` e decorators adicionados em Controllers e DTOs, acessível em `/api-docs`.

**Ainda não iniciado:** arquivo final `README.md` (com instruções de deploy local) e consolidação/revisão dos commits e arquivos de prompt.

---

## 2. Prazo confirmado

- Documento emitido em 25/08/2026, **recebido em 30/08/2026**.
- **Prazo real: até 01/09/2026** — restam efetivamente ~2 dias corridos a partir de hoje.
- Plano de corte em caso de aperto (ordem de prioridade a manter): upload + dedupe + consulta **nunca corta**; se faltar tempo, cortar nesta ordem: testes automatizados → fila de conferência (fica só especificada em `ARCHITECTURE.md`, não implementada) → retry sofisticado do worker (vira retry simples).

---

## 3. Decisões tomadas nesta sessão (além do que já está em `docs/ARCHITECTURE.md`)

| Decisão | Escolha | Motivo |
|---|---|---|
| Sistema de módulos do Nest | **ESM + Vitest** (Corrigido) | A aplicação estava usando Vite/Vitest por baixo dos panos na compilação e teste (`npm test` chamava Vitest). Os testes foram escritos com `vi.mock` e `vi.spyOn` adequados ao ESM em vez de Jest. |
| Estratégia de Mocks | `Test.createTestingModule` com `useValue` | Abordagem mais recomendada pelo ecossistema NestJS, injetando funções do Vitest/Jest mockadas (ex: `{ document: { findUnique: vi.fn() } }`) diretamente sobre o repositório em vez de mockar módulos isolados que falham no build. |
| Falha no BullMQ | Exceções **devem estourar** | Foi decidido explicitamente **não** silenciar erros no `try/catch` do consumer. O erro é propagado para o BullMQ de forma que ele enfileire o retry e incremente o contador `attemptsMade`. |
| Localização do docker-compose | `db/docker-compose.yml` (não na raiz) | Organização escolhida pelo candidato; comando de subida ajustado para `docker compose -f db/docker-compose.yml up -d`. |

> ⚠️ Se o `AGENTS.md` ainda referencia os arquivos de docs sem o prefixo `docs/`, corrigir os caminhos nas seções 2 e 6 dele antes de seguir — o agente precisa achar os arquivos certos.

---

## Testes manuais realizados

- Upload válido → 201, Document criado com status PENDING ✅
- Reenvio do mesmo arquivo → inicialmente criava duplicata (bug: dedupe checava só na resposta, não antes de persistir) → corrigido, agora retorna o mesmo id ✅
- Upload de tipo inválido → 400 com corpo consistente (bug anterior: 201 com corpo de erro 400, corrigido) ✅
- Encoding de nome de arquivo com acento → estava quebrado (latin1 vs utf-8), corrigido ✅
- storageKey expondo caminho absoluto da máquina local → corrigido para caminho relativo ✅
- GET /documents e GET /documents/:id → funcionando ✅
- Processamento IA simulada (alta confiança 0.95) → PENDING → PROCESSING → READY (~2s) ✅
- Processamento IA simulada (baixa confiança 0.5) → PROCESSING → NEEDS_REVIEW ✅
- Swagger UI → acessível em `/api-docs` sem estourar compilação ✅

---

## Testes automatizados realizados (Vitest)

- **`documents.service.spec.ts`**: Valida a deduplicação rigorosa baseada no `contentHash` (Fato c). Confirma que requisições duplicadas recuperam o BD mas pulam completamente a regravação (`.create` not called) e IA. ✅
- **`processing.consumer.spec.ts`**: Valida que a confiança da IA rege o fluxo final de `READY` vs `NEEDS_REVIEW`. Valida a resiliência (Fato a), confirmando que enquanto há tentativas o arquivo permanece `PROCESSING`, e só quando `attemptsMade >= opts.attempts` ele ganha a flag final de `FAILED`. ✅
- **`review.service.spec.ts`**: Valida concorrência da fila de conferência (Fato g), usando mocks do Prisma para provar que a API rejeita `409 Conflict` se tentar roubar a trava ativa de outrem, mas permite a renovação de sua própria trava. ✅

---

## 4. Próximos passos imediatos (nesta ordem)

1. ✅ **`PrismaModule` / `PrismaService`** — concluído.
2. ✅ **`ConfigModule`** com validação de schema (Joi/Zod) — concluído.
3. ✅ **`ValidationPipe` global** no `main.ts` — concluído.
4. ✅ **`DocumentsModule`** — concluído e testado.
5. ✅ **`AiModule`** (`AiPort` + `StubAiAdapter`) — concluído.
6. ✅ **`ProcessingModule`** (BullMQ worker + retry/backoff) — concluído e testado.
7. ✅ **`ReviewModule`** (claim + correct) — concluído e testado.
8. ✅ Testes dos 4 cenários de `docs/FEATURES.md` seção 4 — concluídos 100%.
9. ✅ Documentação Swagger OpenAPI na fatia vertical — concluída.
10. **`README.md` do projeto, revisão de commits, prompts salvos, carta de fechamento.**

---

## 5. Lembretes operacionais

- **Commits:** um por unidade lógica, Conventional Commits, mensagem revisada antes de aceitar (ver `AGENTS.md` seção 4).
- **Prompts:** salvar em `prompts/NN-descricao.md`, em ordem, como escritos originalmente — inclusive prompts "pequenos" como a escolha CJS/Jest, já que contam como decisão registrada.
- **Nunca implementar o que está em "fica FORA" de `docs/FEATURES.md`** sem decisão explícita de trocar prioridade.
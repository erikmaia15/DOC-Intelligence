# Arquitetura — DOC Intelligence (Trilha A · Back-end)

> Este documento é o registro de decisões de arquitetura (ADR consolidado). Ele existe **antes** do código — é a especificação exigida pelo item 2 da entrega ("O projeto"). Se a implementação divergir disso, este arquivo deve ser mantido como estava, e a divergência anotada em `DIVERGENCIAS.md` (a criar quando/se acontecer).

---

## 1. Stack escolhida e por quê

| Decisão | Escolhido | Alternativas consideradas | Por que descartei as alternativas |
|---|---|---|---|
| Linguagem/Framework | **NestJS + TypeScript** | Express puro, Fastify puro | NestJS já impõe modularidade (módulos/providers/DI), que é justamente o critério de maior peso (30%) na avaliação. Express puro exigiria reconstruir isso à mão, gastando tempo em estrutura em vez de decisão. |
| ORM/Banco | **PostgreSQL + Prisma** | TypeORM, Postgres cru (SQL manual) | Prisma dá migrations tipadas e schema declarativo, reduzindo tempo de depuração sob prazo de 3 dias com ~3-4h/dia disponíveis. TypeORM foi descartado por ter decorators mais verbosos e histórico de bugs em relações — não vale o tempo extra aqui. |
| Fila assíncrona | **Redis + BullMQ** | Fila in-process (cron/polling em tabela), RabbitMQ | Resolve diretamente o Fato (a) (IA lenta/instável) com retry+backoff nativo, e o Fato (e) (pico de 800 docs/dia) sem exigir infra pesada. In-process foi descartado por não sobreviver a reinício do processo. RabbitMQ foi descartado por ser overkill para o volume descrito (150-800 docs/dia) e adicionar complexidade de operação não justificada pelo escopo da fatia vertical. |
| Infra de desenvolvimento | **Docker Compose** (app + postgres + redis) | Instruções manuais de instalação local | Elimina "funciona na minha máquina"; README vira "clone e `docker compose up`". Custo de manutenção baixo para o ganho de reprodutibilidade — item avaliado no critério de especificação/método. |
| Adapter de IA | **Interface `AiPort` + implementação dublê** | Integração real com um provedor específico | O edital permite explicitamente IA "dublê" na fatia vertical. Deixar o provedor real genérico no ADR (não integrar de fato) evita gastar orçamento de tempo em credenciais/latência de API externa, que não é o que está sendo avaliado. O ponto avaliado é a **abstração** que permite trocar de provedor (Fato f), não qual provedor foi usado. |

---

## 2. Fatos do ambiente → decisão de arquitetura

Esta seção existe porque o edital pede explicitamente rastreabilidade sobre os fatos do ambiente (15% da nota) e diz que cada fato deve ser **resolvido** ou **registrado como risco consciente**.

| Fato | Tratamento | Onde vive no código |
|---|---|---|
| (a) IA de terceiro leva 5-40s, cobrada por doc, às vezes falha | **Resolvido.** Processamento é assíncrono via fila; job tem retry com backoff exponencial (ex.: 3 tentativas); após esgotar tentativas, documento vai para status `FAILED`, visível na API — nunca trava o upload nem o cliente. | `ProcessingModule` (BullMQ worker) |
| (b) Envio sem validação, nomes de arquivo brutos de câmera | **Resolvido.** Validação de tipo MIME e tamanho no endpoint de upload; nome original é preservado como metadado, nunca usado como chave/identificador. | `DocumentsModule` (upload handler) |
| (c) Mesmo documento chega mais de uma vez | **Resolvido.** Hash de conteúdo (SHA-256) calculado no upload, antes de qualquer enfileiramento; se hash já existe, retorna o documento existente em vez de reprocessar. | `DocumentsModule` (dedupe antes de publicar job) |
| (d) Conteúdo é dado pessoal, parte sensível (LGPD) | **Parcialmente resolvido + risco registrado.** Logs estruturados nunca incluem `extractedFields` nem o conteúdo do arquivo — apenas IDs e status. Criptografia em repouso do storage de arquivos **fica fora da fatia vertical** e é registrada aqui como risco conhecido: em produção real, exigiria storage criptografado (ex. S3 com SSE) e política de retenção/expurgo, não implementados no prazo da prova. |
| (e) Volume médio 150/dia, pico >800 concentrado em 2h | **Resolvido pela escolha de fila.** BullMQ com Redis absorve picos de enfileiramento sem acoplar ao tempo de resposta da IA; workers podem escalar horizontalmente (fora do escopo implementar isso na prova, mas a arquitetura permite). |
| (f) Modelo do fornecedor e prompts vão mudar | **Resolvido.** `AiPort` (interface) isola o restante do sistema da implementação concreta do provedor. Prompts vivem em arquivos versionados em `PromptsModule`, referenciados por configuração — trocar de versão de modelo ou de prompt não exige tocar em `ProcessingModule` nem `ReviewModule`. |
| (g) Duas pessoas podem abrir a fila de conferência ao mesmo tempo | **Resolvido.** `ReviewClaim` com lock por TTL: ao abrir um item para revisão, o revisor "reivindica" (`claim`) o documento; outro revisor tentando corrigir o mesmo item recebe `409 Conflict` enquanto o lock estiver ativo. |

---

## 3. Modelo de dados (Prisma schema — rascunho conceitual)

```prisma
model Document {
  id               String   @id @default(uuid())
  originalFilename String
  storageKey       String
  mimeType         String
  sizeBytes        Int
  contentHash      String   @unique
  status           DocumentStatus @default(PENDING)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  extractionResult ExtractionResult?
  reviewClaim      ReviewClaim?
}

enum DocumentStatus {
  PENDING
  PROCESSING
  READY
  NEEDS_REVIEW
  FAILED
}

model ExtractionResult {
  id                String   @id @default(uuid())
  documentId        String   @unique
  document          Document @relation(fields: [documentId], references: [id])
  documentType      String
  extractedFields   Json
  suggestedFilename String
  confidenceScore   Float
  createdAt         DateTime @default(now())
}

model ReviewClaim {
  id              String    @id @default(uuid())
  documentId      String    @unique
  document        Document  @relation(fields: [documentId], references: [id])
  lockedBy        String
  lockedAt        DateTime
  expiresAt       DateTime
  correctedFields Json?
  reviewedBy      String?
  reviewedAt      DateTime?
}
```

---

## 4. Contrato de API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/documents` | Upload multipart. Calcula hash, deduplica, persiste, enfileira job. Retorna `Document` (status `PENDING` ou existente se duplicado). |
| `GET` | `/documents` | Lista documentos, filtrável por `status`. |
| `GET` | `/documents/:id` | Detalhe do documento + `ExtractionResult`, se houver. |
| `GET` | `/review-queue` | Lista documentos com status `NEEDS_REVIEW` não travados (ou travados pelo próprio solicitante). |
| `POST` | `/review-queue/:id/claim` | Cria/renova `ReviewClaim` com TTL. `409` se já travado por outro revisor. |
| `POST` | `/review-queue/:id/correct` | Salva `correctedFields`, marca `reviewedBy`/`reviewedAt`, atualiza `Document.status` para `READY`. Exige claim válido do solicitante. |

---

## 5. Módulos NestJS

```
src/
  documents/        -- DocumentsModule: upload, listagem, dedupe por hash
  processing/        -- ProcessingModule: BullMQ producer + worker, retry/backoff
  ai/                -- AiModule: AiPort (interface) + StubAiAdapter (dublê)
  review/             -- ReviewModule: fila de conferência, claim/lock, correção
  prisma/             -- PrismaModule: cliente Prisma como provider injetável
  prompts/            -- PromptsModule: prompts versionados em arquivos + loader
  common/             -- filtros de exceção, pipes de validação, interceptors de log
```

**Regra de dependência:** `documents`, `review` e `processing` dependem de `ai` via a interface `AiPort` — nunca da implementação concreta. Isso é o que torna o Fato (f) resolvido de fato, não só no papel.

---

## 6. O que fica explicitamente fora da fatia vertical (registrado, não escondido)

- Autenticação/autorização reais (edital dispensa).
- Criptografia em repouso do storage de arquivos (ver Fato d).
- Escalonamento horizontal real dos workers (a arquitetura permite; não será demonstrado).
- Listagem com filtros avançados (busca textual, paginação sofisticada) — fica um `GET` simples.
- Integração real com um provedor de IA — usa-se `StubAiAdapter`.
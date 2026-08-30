# Boas Práticas NestJS — DOC Intelligence

> Guia de convenções para manter a nota de "arquitetura e modularidade" (30% da avaliação) consistente durante a implementação. Use isto como referência de estilo ao gerar código com o agente no Antigravity.

---

## 1. Estrutura em camadas dentro de cada módulo

Cada módulo (`documents`, `processing`, `ai`, `review`) segue a mesma forma interna:

```
documents/
  documents.module.ts
  documents.controller.ts     -- HTTP: recebe request, valida DTO, chama service, retorna response
  documents.service.ts        -- regra de negócio (dedupe, orquestração)
  documents.repository.ts     -- acesso a dados via Prisma (isola o service do ORM)
  dto/
    upload-document.dto.ts
    document-response.dto.ts
```

**Regra:** `Controller` nunca acessa o Prisma diretamente. `Service` nunca conhece detalhes de HTTP (status codes, headers). Isso é o que permite trocar uma peça sem quebrar as outras — exatamente o critério de 30% da nota.

---

## 2. Portas e adapters para dependências externas

A IA é a dependência externa mais instável do sistema (Fato a, Fato f). Trate-a como uma **porta**, não como uma implementação:

```typescript
// ai/ai.port.ts
export interface AiPort {
  classifyAndExtract(fileBuffer: Buffer, mimeType: string): Promise<AiExtractionResult>;
}

// ai/stub-ai.adapter.ts
@Injectable()
export class StubAiAdapter implements AiPort {
  async classifyAndExtract(): Promise<AiExtractionResult> {
    // resposta fixa/determinística — o "dublê" permitido pelo edital
  }
}
```

Registrar via token de injeção (`AI_PORT`) no `AiModule`, nunca importar `StubAiAdapter` diretamente em outro módulo — só a interface.

---

## 3. Validação de entrada

- **class-validator + class-transformer** em todos os DTOs. `ValidationPipe` global no `main.ts` com `whitelist: true, forbidNonWhitelisted: true` — rejeita payload com campos não esperados (relevante dado o Fato b: quem envia não valida nada do lado dele).
- Nunca confiar em `mimeType` declarado pelo cliente sem checagem adicional (magic bytes), se o tempo permitir — senão, registrar como risco conhecido em `FEATURES.md`.

---

## 4. Configuração e variáveis de ambiente

- `@nestjs/config` com um **schema Joi/Zod de validação no bootstrap** — o app não deve subir se faltar `DATABASE_URL` ou `REDIS_URL`. Isso evita falhas silenciosas em produção, coerente com a seriedade que o edital pede sobre robustez.
- Nenhum segredo hardcoded. `.env.example` versionado, `.env` no `.gitignore`.

---

## 5. Tratamento de erros

- `HttpExceptionFilter` global padronizando o formato de erro (`{ statusCode, message, error }`).
- Erros de negócio (ex.: tentar `correct` sem `claim` válido) usam exceptions específicas (`ClaimNotFoundException`, `ClaimExpiredException`) mapeadas para o status HTTP certo (409/404) — não `throw new Error()` genérico.
- No worker BullMQ: capturar exceções do `AiPort`, deixar o BullMQ controlar o retry (não fazer retry manual dentro do service).

---

## 6. Logging

- Logger estruturado (Nest `Logger` built-in é suficiente para o escopo da prova; Pino é alternativa se quiser JSON estruturado).
- **Nunca logar `extractedFields` nem o conteúdo do arquivo** (Fato d — dado pessoal sensível). Logar apenas `documentId`, `status`, `durationMs`.
- Log de início/fim de cada job do worker, com correlação por `documentId` — essencial para debugar falhas da IA (Fato a) depois.

---

## 7. Persistência

- `PrismaService` como provider único, injetado onde necessário — nunca instanciar `PrismaClient` fora dele.
- Migrations do Prisma versionadas no repositório (`prisma/migrations/`) — nunca `db push` direto em ambiente compartilhado.
- Índice único em `Document.contentHash` no schema (não só checagem em código) — a garantia de dedupe precisa existir no banco, não só na aplicação.

---

## 8. Testes

- **Testes unitários** nos `services` com Prisma e `AiPort` mockados (Jest, `@nestjs/testing`).
- **Testes de integração** (opcional, se sobrar tempo) usando um Postgres/Redis de teste via docker-compose — cobrir só os 4 cenários listados em `FEATURES.md` seção 4.
- Não perseguir cobertura alta — o edital dispensa isso explicitamente; tempo é mais bem gasto em especificação e ADRs.

---

## 9. Commits

- Commits pequenos e descritivos, refletindo a ordem real do trabalho (setup → schema → módulo de documents → fila → review → docs). **Nunca squash final para esconder o processo** — o edital quer ver o histórico real, não um commit "initial".
- Sugestão de convenção: `feat(documents): add upload endpoint with hash dedupe`, `feat(processing): add BullMQ worker with retry`, etc.

---

## 10. O que NÃO fazer (armadilhas comuns em provas assim)

- Não colocar lógica de negócio no controller "para ir mais rápido" — é exatamente o que o critério de arquitetura penaliza.
- Não importar `PrismaClient` ou `StubAiAdapter` fora do módulo dono — quebra a fronteira que o Fato (f) exige.
- Não deixar prompts (mesmo que não usados de fato pelo stub) espalhados como strings inline — devem existir como artefato versionado em `prompts/`, coerente com o item 4 da entrega (registro de prompts).
- Não gerar um único commit gigante no fim — revisar o histórico antes de entregar.
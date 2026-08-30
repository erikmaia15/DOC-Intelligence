# Funcionalidades — DOC Intelligence (Trilha A · Back-end)

> Mapeamento entre o "produto-alvo" pedido pelo edital (5 comportamentos) e o que efetivamente entra na fatia vertical implementada. Ver `ARCHITECTURE.md` para as decisões técnicas por trás de cada item.

---

## 1. Produto-alvo (o que o edital pediu, na íntegra)

1. Receber um documento (imagem ou PDF) enviado por uma aplicação cliente.
2. Descobrir o tipo de documento, extrair campos relevantes e propor nome padronizado.
3. Permitir consultar o resultado de um documento e listar os já processados.
4. Quando a confiança for baixa, o documento não entra como pronto — vai para conferência humana.
5. Ser consumido por outros sistemas internos (não por navegador anônimo).

**Importante: esta lista é o alvo do produto, não o escopo da entrega.** A fatia vertical cobre uma parte honesta disso — ver seção 2.

---

## 2. Escopo da fatia vertical — o que ENTRA

| # | Funcionalidade | Status | Cobre o comportamento-alvo |
|---|---|---|---|
| 1 | `POST /documents` — upload com validação de tipo/tamanho | ✅ Dentro | #1 |
| 2 | Dedupe por hash de conteúdo no upload | ✅ Dentro | Fato (c) |
| 3 | Enfileiramento assíncrono (BullMQ) + worker processando via `StubAiAdapter` | ✅ Dentro | #2 (com IA dublê) |
| 4 | `StubAiAdapter` com resposta fixa configurável (alta e baixa confiança) | ✅ Dentro | #2, #4 |
| 5 | Roteamento por confiança: `READY` vs `NEEDS_REVIEW` | ✅ Dentro | #4 |
| 6 | `GET /documents` e `GET /documents/:id` — consulta e listagem | ✅ Dentro | #3 |
| 7 | `GET /review-queue` — fila de conferência | ✅ Dentro | #4 |
| 8 | `POST /review-queue/:id/claim` — trava com TTL (concorrência, Fato g) | ✅ Dentro | #4 |
| 9 | `POST /review-queue/:id/correct` — correção humana | ✅ Dentro | #4 |
| 10 | Retry com backoff no worker (Fato a) | ✅ Dentro | Robustez |
| 11 | Contrato de API documentado (README/OpenAPI) | ✅ Dentro | #5 |

---

## 3. O que fica FORA (registrado explicitamente, não escondido)

| Funcionalidade | Por que ficou fora | Risco se não for feito depois |
|---|---|---|
| Integração real com um provedor de IA (Claude/GPT/Gemini) | Fora do que a prova pede; a interface `AiPort` já demonstra a abstração necessária | Baixo — troca é só implementar um novo adapter |
| Autenticação/autorização reais | Edital dispensa explicitamente | Médio — necessário antes de qualquer uso real, já que o serviço será consumido por sistemas internos (comportamento #5) |
| Criptografia em repouso do storage de arquivos | Fora do prazo de 3 dias; dado sensível exige isso em produção (LGPD) | **Alto** — é o primeiro risco de compliance a resolver antes de produção real |
| Escalonamento horizontal de workers | Arquitetura permite, mas não será demonstrado/testado | Baixo a médio, depende do volume real |
| Filtros avançados de busca/paginação sofisticada | `GET /documents` fica simples (filtro por status apenas) | Baixo |
| Interface gráfica (é Trilha A) | Fora de escopo por definição da trilha escolhida | N/A |
| Testes de carga simulando pico de 800 docs/dia | Não há tempo no orçamento de ~3-4h/dia por 3 dias | Médio — é exatamente o que "quebra primeiro se o volume for x10" (pergunta da carta de fechamento) |

---

## 4. O que testar, e por quê (para o parágrafo exigido no item 3 da entrega)

Prioridade de testes dado o tempo disponível (~3-4h/dia):

1. **Dedupe por hash** — é a regra de negócio mais fácil de quebrar silenciosamente (ex.: comparar por nome de arquivo por engano) e diretamente ligada a um fato do ambiente (c).
2. **Roteamento de confiança** (`READY` vs `NEEDS_REVIEW`) — é o comportamento #4 do produto-alvo, o coração do "não deixar entrar como pronto".
3. **Concorrência no claim da fila de revisão** — testar que o segundo `claim` sobre o mesmo documento retorna `409` enquanto o primeiro está ativo (Fato g).
4. **Retry do worker** — simular falha do `AiPort` e verificar que o job tenta novamente e, ao esgotar tentativas, o documento vai para `FAILED` sem travar o restante do sistema.

Testes de infraestrutura (conexão com Postgres/Redis) e de formatação de payload ficam com cobertura mínima — não é o que a prova avalia (edital dispensa "alta cobertura de testes" explicitamente).
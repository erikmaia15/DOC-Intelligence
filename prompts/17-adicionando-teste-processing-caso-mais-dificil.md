faça com que já fez, seguindo o padrão e vou mandar o prompt para seguir:

Contexto:
Estamos desenvolvendo os testes unitários para a classe ProcessingConsumer usando Vitest. O arquivo alvo é o processing.consumer.spec.ts. Já temos os testes do método process() cobrindo o roteamento de confiança (READY e NEEDS_REVIEW) e o cenário de erro interno propagado para o BullMQ.

Objetivo:
Agora precisamos testar o comportamento do decorator @OnWorkerEvent('failed'), especificamente o método onFailed(job, error), garantindo que o ciclo de retentativas e a falha final funcionem conforme a regra de negócio de não travar o processamento (Fato a).

O que você deve implementar:
Adicione um novo bloco describe('onFailed') dentro do arquivo de testes existente, contendo dois novos cenários:

Falha intermediária (Retry em andamento): Crie um mock de Job onde job.attemptsMade seja menor que job.opts.attempts (ex: 1 de 3). Chame consumer.onFailed(job, new Error()). A asserção deve garantir que prisma.document.update não foi chamado, pois o BullMQ ainda tentará novamente.

Falha final (Tentativas esgotadas): Crie um mock de Job onde job.attemptsMade seja igual ou maior que job.opts.attempts (ex: 3 de 3). Chame consumer.onFailed(job, new Error()). A asserção deve garantir que prisma.document.update foi chamado passando status: DocumentStatus.FAILED para o documentId correto, confirmando que o documento foi marcado como falho no banco.

Restrições:

Continue usando a sintaxe e os imports do Vitest (describe, it, expect, vi).

Não altere os testes já existentes do método process().

Mantenha os mocks do PrismaService limpos usando vi.clearAllMocks() no beforeEach, para que as contagens de chamadas no onFailed não conflitem com os testes do process().

Escreva apenas o código dos testes que devem ser adicionados, e me explique brevemente a estrutura do mock do Job.
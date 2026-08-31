Antes de codar, leia docs/ARCHITECTURE.md seção 1 (fila BullMQ+Redis) e seção 2 (Fato a), docs/NESTJS-BEST-PRACTICES.md seção 5 (tratamento de erros no worker — deixar o BullMQ controlar o retry, não fazer retry manual).

Cria o ProcessingModule em src/modules/processing/:

Configure o BullModule (do @nestjs/bullmq) conectando ao Redis usando REDIS_HOST/REDIS_PORT do ConfigModule, com uma fila chamada document-processing.
Crie um ProcessingProducer (processing.producer.ts) com um método enqueue(documentId: string) que adiciona um job à fila, configurado com retry (3 tentativas, backoff exponencial iniciando em 2s).
Crie um ProcessingConsumer/worker (processing.consumer.ts, usando @Processor('document-processing')) que: busca o Document pelo id via PrismaService, atualiza status para PROCESSING, chama AiPort.classifyAndExtract() (injetado pelo token AI_PORT) passando o buffer do arquivo lido de storage/, salva o ExtractionResult, e atualiza o Document.status para READY se confidenceScore >= 0.8, ou NEEDS_REVIEW se abaixo disso.
Se todas as tentativas do job falharem (evento failed do BullMQ esgotado), atualize o Document.status para FAILED — não deixe o documento travado em PROCESSING para sempre.
No DocumentsModule, ajuste o método de criação para chamar ProcessingProducer.enqueue() depois de persistir o documento como PENDING (só para documentos novos, não para duplicatas retornadas pelo dedupe).
Registre ProcessingModule no AppModule.

Antes de gerar qualquer código, me explique: (a) por que o retry deve ser configurado no BullMQ e não em try/catch manual dentro do consumer, e (b) o que acontece com o status do documento em cada etapa da falha — para eu confirmar que nenhum documento fica "preso" num status intermediário para sempre.

Não crie o ReviewModule agora — isso é o próximo passo.
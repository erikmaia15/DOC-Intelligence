Antes de codar, leia docs/ARCHITECTURE.md seção 2 (fatos b e c) e seção 4 (contrato de API), docs/FEATURES.md seção 2 (itens 1 e 2), e docs/NESTJS-BEST-PRACTICES.md seções 1, 3, 5 e 7.

Cria o DocumentsModule em src/documents/, seguindo a estrutura em camadas da seção 1 do NESTJS-BEST-PRACTICES.md (documents.controller.ts, documents.service.ts, documents.repository.ts, dto/):

POST /documents — upload multipart de um único arquivo (usa FileInterceptor do Nest). Valide mimeType (aceitar apenas image/jpeg, image/png, application/pdf) e sizeBytes (máximo 10MB) no service, rejeitando com erro claro se não passar — isso cobre o Fato (b) do ARCHITECTURE.md (quem envia não valida nada do lado dele).
Calcule o hash SHA-256 do conteúdo do arquivo antes de qualquer persistência. Se já existir um Document com esse contentHash, retorne o documento existente (não crie um novo, não lance erro) — isso é o dedupe do Fato (c).
Se for novo, persista via PrismaService (injetado, nunca instanciado direto — regra da seção 7) com status PENDING, salvando o arquivo em disco local (pasta storage/, fora do controle de versão) e gravando o caminho em storageKey.
GET /documents — lista documentos, aceitando query param opcional status para filtrar.
GET /documents/:id — retorna o documento com o extractionResult, se existir (relação já modelada no schema Prisma).
Use DTOs com class-validator para validar query params e response shape, conforme seção 3 do NESTJS-BEST-PRACTICES.md.
Não implemente enfileiramento na fila (isso é o próximo módulo, ProcessingModule) — o service deste módulo só persiste o documento como PENDING; deixe um método público claro (ex. create()) que o ProcessingModule vai chamar/complementar depois.
Registre o DocumentsModule no AppModule.

Antes de gerar qualquer código, me explique em poucas linhas: (a) por que o hash é calculado no service e não no controller, e (b) por que checar duplicata por hash antes de persistir é mais seguro do que confiar só no @unique do Prisma e tratar o erro depois (ou se as duas coisas devem coexistir, dado o PrismaExceptionFilter que já criamos).

Não crie o ProcessingModule, o AiModule nem o ReviewModule agora — só o DocumentsModule.
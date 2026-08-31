Contexto:
Estamos finalizando a fatia vertical do back-end do "DOC Intelligence". Preciso documentar o contrato da API utilizando Swagger (OpenAPI) para cumprir o requisito de que o serviço será consumido por outros sistemas internos do escritório.

O que você deve fazer:

Dependências: Me dê o comando exato de instalação do @nestjs/swagger e do pacote necessário para servir a UI (ex: swagger-ui-express).

Configuração base (main.ts): Atualize o main.ts para incluir a configuração do DocumentBuilder e o SwaggerModule.

Título: DOC Intelligence API

Descrição: API para processamento assíncrono e revisão humana de documentos (Fatia Vertical - Trilha A)

Versão: 1.0

Rota da documentação: /api-docs

Decoração dos Controllers e DTOs: Gere exemplos de como devo decorar meus controllers (DocumentsController e ReviewController) e os principais DTOs de entrada/saída (como o de Upload e o de Correção). Preciso que as rotas mapeadas no ARCHITECTURE.md (POST /documents, GET /review-queue, etc.) fiquem claras, mostrando os status de sucesso e os mapeamentos de erro (ex: 409 Conflict no claim de revisão).

Restrições:
Mantenha o código limpo e direto. Não crie lógica de negócio nova, apenas adicione os decorators (@ApiTags, @ApiOperation, @ApiResponse, @ApiProperty, etc.) aos controllers e DTOs já existentes.
Antes de codar, leia docs/ARCHITECTURE.md seção 1 (linha do adapter de IA) e seção 6, e docs/FEATURES.md item 4 (StubAiAdapter com resposta configurável de alta e baixa confiança).

Cria o AiModule em src/modules/ai/, seguindo a estrutura em camadas:

Interface AiPort em ai.port.ts, com o método classifyAndExtract(fileBuffer: Buffer, mimeType: string): Promise<AiExtractionResult>, onde AiExtractionResult tem documentType: string, extractedFields: Record<string, unknown>, suggestedFilename: string, confidenceScore: number.
Implementação StubAiAdapter em stub-ai.adapter.ts, implementando AiPort, retornando um resultado fixo e determinístico simulando a extração de uma identidade (nome, filiação, data de nascimento, número, órgão emissor fictícios). O confidenceScore deve poder ser configurado via variável de ambiente (STUB_AI_CONFIDENCE, default 0.95) para permitir simular tanto o caminho de alta confiança (READY) quanto o de baixa confiança (NEEDS_REVIEW) sem mudar código.
Registre StubAiAdapter como provider do token AI_PORT (injeção por interface, não por classe concreta), exportado pelo AiModule.
Não crie o ProcessingModule nem conecte isso ao DocumentsModule ainda — isso vem no próximo passo.

Antes de gerar o código, me explique por que registrar via token (AI_PORT) em vez de injetar StubAiAdapter diretamente é o que garante a troca futura de provedor sem alterar ProcessingModule (Fato f do edital).
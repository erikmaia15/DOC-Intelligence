import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiPort, AiExtractionResult } from './ai.port.js';

@Injectable()
export class StubAiAdapter implements AiPort {
  constructor(private configService: ConfigService) {}

  async classifyAndExtract(fileBuffer: Buffer, mimeType: string): Promise<AiExtractionResult> {
    // Simula a latência da IA (Fato a)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // STUB_AI_CONFIDENCE permite injetar o fluxo de baixa confiança para teste local
    const confidenceScoreStr = this.configService.get<string>('STUB_AI_CONFIDENCE');
    const confidenceScore = confidenceScoreStr ? parseFloat(confidenceScoreStr) : 0.95;

    return {
      documentType: 'RG',
      extractedFields: {
        nome: 'João Silva Fictício',
        filiacao: ['José Silva', 'Maria Silva'],
        dataNascimento: '1990-01-01',
        numero: '12.345.678-9',
        orgaoEmissor: 'SSP/SP'
      },
      suggestedFilename: 'joao_silva_rg',
      confidenceScore: confidenceScore,
    };
  }
}

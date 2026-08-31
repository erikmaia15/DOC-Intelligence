import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AI_PORT } from '../ai/ai.port.js';
import type { AiPort } from '../ai/ai.port.js';
import { DocumentStatus, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Processor('document-processing')
export class ProcessingConsumer extends WorkerHost {
  private readonly logger = new Logger(ProcessingConsumer.name);
  private readonly storageDir = path.join(process.cwd(), 'storage');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PORT) private readonly aiPort: AiPort,
  ) {
    super();
  }

  async process(job: Job<{ documentId: string }>): Promise<void> {
    const { documentId } = job.data;
    this.logger.log(`Iniciando processamento do documento ${documentId} (Tentativa ${job.attemptsMade + 1})`);

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      this.logger.error(`Documento ${documentId} não encontrado no banco`);
      throw new Error('Documento não encontrado');
    }

    // Atualiza status para PROCESSING
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING },
    });

    // Lê o arquivo do disco local
    const filePath = path.join(this.storageDir, document.storageKey);
    const fileBuffer = await fs.readFile(filePath);

    // Extrai dados via AI_PORT (Pode lançar erro simulando instabilidade)
    const result = await this.aiPort.classifyAndExtract(fileBuffer, document.mimeType);

    // Salva o resultado da extração
    await this.prisma.extractionResult.create({
      data: {
        documentId: document.id,
        documentType: result.documentType,
        extractedFields: result.extractedFields as unknown as Prisma.InputJsonValue,
        suggestedFilename: result.suggestedFilename,
        confidenceScore: result.confidenceScore,
      },
    });

    // Roteamento baseado em confiança
    const finalStatus = result.confidenceScore >= 0.8 ? DocumentStatus.READY : DocumentStatus.NEEDS_REVIEW;

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: finalStatus },
    });

    this.logger.log(`Documento ${documentId} processado com sucesso. Status final: ${finalStatus}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    if (!job) return;

    this.logger.error(`Falha no processamento do documento ${job.data.documentId}: ${error.message}`);

    // Verifica se esgotaram todas as tentativas configuradas
    if (job.attemptsMade >= (job.opts.attempts || 0)) {
      this.logger.error(`Todas as tentativas esgotadas para o documento ${job.data.documentId}. Marcando como FAILED.`);
      
      await this.prisma.document.update({
        where: { id: job.data.documentId },
        data: { status: DocumentStatus.FAILED },
      });
    }
  }
}

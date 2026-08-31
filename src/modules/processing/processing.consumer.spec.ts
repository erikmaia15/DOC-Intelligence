import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProcessingConsumer } from './processing.consumer.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AI_PORT } from '../ai/ai.port.js';
import { DocumentStatus } from '@prisma/client';
import { Job } from 'bullmq';
import * as fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock-file-content')),
}));

describe('ProcessingConsumer', () => {
  let consumer: ProcessingConsumer;
  let prisma: PrismaService;
  let aiPort: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessingConsumer,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findUnique: vi.fn(),
              update: vi.fn(),
            },
            extractionResult: {
              create: vi.fn(),
            },
          },
        },
        {
          provide: AI_PORT,
          useValue: {
            classifyAndExtract: vi.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<ProcessingConsumer>(ProcessingConsumer);
    prisma = module.get<PrismaService>(PrismaService);
    aiPort = module.get(AI_PORT);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Roteamento de confiança (READY vs NEEDS_REVIEW)', () => {
    const mockDocument = {
      id: 'doc-123',
      storageKey: 'arquivo.pdf',
      mimeType: 'application/pdf',
      status: DocumentStatus.PENDING,
    };

    const mockJob = {
      data: { documentId: 'doc-123' },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job;

    beforeEach(() => {
      // Simula que o documento sempre existe no início do processo
      (prisma.document.findUnique as any).mockResolvedValue(mockDocument);
      (prisma.document.update as any).mockResolvedValue(mockDocument);
      (prisma.extractionResult.create as any).mockResolvedValue({});
    });

    it('deve atualizar status para READY quando a confiança for >= 0.8', async () => {
      // Simula IA retornando confiança alta
      aiPort.classifyAndExtract.mockResolvedValue({
        documentType: 'RG',
        extractedFields: { nome: 'Teste' },
        suggestedFilename: 'teste_rg',
        confidenceScore: 0.95, // Alta confiança
      });

      await consumer.process(mockJob);

      // Deve ter atualizado para PROCESSING primeiro, e depois para READY
      expect(prisma.document.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'doc-123' },
        data: { status: DocumentStatus.PROCESSING },
      });

      expect(prisma.document.update).toHaveBeenLastCalledWith({
        where: { id: 'doc-123' },
        data: { status: DocumentStatus.READY },
      });
    });

    it('deve atualizar status para NEEDS_REVIEW quando a confiança for < 0.8', async () => {
      // Simula IA retornando confiança baixa
      aiPort.classifyAndExtract.mockResolvedValue({
        documentType: 'RG',
        extractedFields: { nome: 'Teste Ilegível' },
        suggestedFilename: 'teste_rg',
        confidenceScore: 0.75, // Baixa confiança
      });

      await consumer.process(mockJob);

      // Deve ter atualizado para PROCESSING primeiro, e depois para NEEDS_REVIEW
      expect(prisma.document.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'doc-123' },
        data: { status: DocumentStatus.PROCESSING },
      });

      expect(prisma.document.update).toHaveBeenLastCalledWith({
        where: { id: 'doc-123' },
        data: { status: DocumentStatus.NEEDS_REVIEW },
      });
    });
  });
});

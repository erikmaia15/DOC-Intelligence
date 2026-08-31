import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentsService } from './documents.service.js';
import { DocumentsRepository } from './documents.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProcessingProducer } from '../processing/processing.producer.js';
import { BadRequestException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import * as fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: PrismaService;
  let producer: ProcessingProducer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        DocumentsRepository,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findUnique: vi.fn(),
              create: vi.fn(),
            },
          },
        },
        {
          provide: ProcessingProducer,
          useValue: {
            enqueue: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get<PrismaService>(PrismaService);
    producer = module.get<ProcessingProducer>(ProcessingProducer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAndCreate', () => {
    const mockFile = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('conteudo-do-arquivo-para-hash'),
    } as Express.Multer.File;

    it('deve rejeitar arquivo sem buffer/requisição', async () => {
      await expect(service.uploadAndCreate(null as any)).rejects.toThrow(BadRequestException);
    });

    it('deve criar um novo documento e enfileirar quando o hash for inédito', async () => {
      const mockCreatedDoc = {
        id: 'doc-123',
        originalFilename: mockFile.originalname,
        contentHash: 'mock-hash',
        status: DocumentStatus.PENDING,
      };

      // Simula que o banco não encontrou hash duplicado
      (prisma.document.findUnique as any).mockResolvedValue(null);
      // Simula a criação
      (prisma.document.create as any).mockResolvedValue(mockCreatedDoc);

      const result = await service.uploadAndCreate(mockFile);

      expect(prisma.document.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.document.create).toHaveBeenCalledTimes(1);
      expect(producer.enqueue).toHaveBeenCalledWith('doc-123');
      expect(result).toEqual(mockCreatedDoc);
      
      // Valida chamada ao filesystem
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('NÃO deve chamar .create nem salvar arquivo se o hash já existir (Fato c)', async () => {
      const existingDoc = {
        id: 'doc-999',
        originalFilename: 'arquivo-anterior.pdf',
        contentHash: 'hash-existente',
        status: DocumentStatus.READY,
      };

      // Simula que o banco JÁ encontrou um documento com esse conteúdo
      (prisma.document.findUnique as any).mockResolvedValue(existingDoc);

      const result = await service.uploadAndCreate(mockFile);

      // Asserts cruciais:
      expect(prisma.document.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.document.create).not.toHaveBeenCalled(); // Garante o bloqueio da duplicação
      expect(producer.enqueue).not.toHaveBeenCalled(); // Não reprocessa IA
      expect(fs.writeFile).not.toHaveBeenCalled(); // Não consome disco à toa
      expect(result).toEqual(existingDoc);
    });
  });
});

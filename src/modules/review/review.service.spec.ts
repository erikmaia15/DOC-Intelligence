import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReviewService } from './review.service.js';
import { ReviewRepository } from './review.repository.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ClaimConflictException } from './exceptions/claim-conflict.exception.js';
import { DocumentStatus } from '@prisma/client';

describe('ReviewService', () => {
  let service: ReviewService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        ReviewRepository,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findUnique: vi.fn(),
            },
            reviewClaim: {
              upsert: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('claimDocument', () => {
    const mockDocumentId = 'doc-123';
    const mockReviewerId = 'revisor-a';
    
    // Um timestamp no futuro para representar uma trava ainda válida
    const futureDate = new Date(new Date().getTime() + 10000); 
    // Um timestamp no passado para representar uma trava vencida
    const pastDate = new Date(new Date().getTime() - 10000);

    it('deve criar um novo ReviewClaim normalmente quando o documento não tem trava ativa', async () => {
      // Simula documento limpo (sem reviewClaim)
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        status: DocumentStatus.NEEDS_REVIEW,
        reviewClaim: null,
      });

      const mockUpsertResult = { id: 'claim-1', lockedBy: mockReviewerId };
      (prisma.reviewClaim.upsert as any).mockResolvedValue(mockUpsertResult);

      const result = await service.claimDocument(mockDocumentId, { reviewerId: mockReviewerId });

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
        include: { reviewClaim: true },
      });
      expect(prisma.reviewClaim.upsert).toHaveBeenCalledTimes(1);
      
      // Valida que o lockedBy foi passado para o upsert
      expect(prisma.reviewClaim.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ lockedBy: mockReviewerId }),
          create: expect.objectContaining({ lockedBy: mockReviewerId }),
        })
      );
      
      expect(result).toEqual(mockUpsertResult);
    });

    it('deve lançar ClaimConflictException se já existir trava ativa de OUTRO revisor', async () => {
      // Simula documento com trava vigente de outra pessoa
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        status: DocumentStatus.NEEDS_REVIEW,
        reviewClaim: {
          lockedBy: 'revisor-b-concorrente',
          expiresAt: futureDate, // Ainda válido
        },
      });

      await expect(
        service.claimDocument(mockDocumentId, { reviewerId: mockReviewerId })
      ).rejects.toThrow(ClaimConflictException);

      // Garante que a escrita no banco não ocorreu
      expect(prisma.reviewClaim.upsert).not.toHaveBeenCalled();
    });

    it('deve permitir a renovação se o claim ativo for do MESMO revisor (não lançar erro)', async () => {
      // Simula documento com trava vigente da PRÓPRIA pessoa
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        status: DocumentStatus.NEEDS_REVIEW,
        reviewClaim: {
          lockedBy: mockReviewerId,
          expiresAt: futureDate,
        },
      });

      const mockUpsertResult = { id: 'claim-1', lockedBy: mockReviewerId };
      (prisma.reviewClaim.upsert as any).mockResolvedValue(mockUpsertResult);

      const result = await service.claimDocument(mockDocumentId, { reviewerId: mockReviewerId });

      // O upsert DEVE ter sido chamado (para esticar o expiresAt)
      expect(prisma.reviewClaim.upsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpsertResult);
    });

    it('deve permitir claim de outro revisor se a trava do revisor antigo tiver expirado', async () => {
      // Simula documento com trava VENCIDA de outra pessoa
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        status: DocumentStatus.NEEDS_REVIEW,
        reviewClaim: {
          lockedBy: 'revisor-b-ausente',
          expiresAt: pastDate, // Expirado
        },
      });

      const mockUpsertResult = { id: 'claim-1', lockedBy: mockReviewerId };
      (prisma.reviewClaim.upsert as any).mockResolvedValue(mockUpsertResult);

      // Esse cenário é garantido pelo fato do if do service validar expiresAt > now
      const result = await service.claimDocument(mockDocumentId, { reviewerId: mockReviewerId });

      expect(prisma.reviewClaim.upsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpsertResult);
    });
  });
});

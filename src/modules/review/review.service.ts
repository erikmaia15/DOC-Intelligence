import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from './review.repository.js';
import { ClaimDocumentDto } from './dto/claim-document.dto.js';
import { CorrectDocumentDto } from './dto/correct-document.dto.js';
import { ClaimConflictException } from './exceptions/claim-conflict.exception.js';
import { ClaimNotFoundException } from './exceptions/claim-not-found.exception.js';
import { ClaimForbiddenException } from './exceptions/claim-forbidden.exception.js';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly repository: ReviewRepository) {}

  async listReviewQueue() {
    return this.repository.findNeedsReviewDocuments(new Date());
  }

  async claimDocument(id: string, dto: ClaimDocumentDto) {
    const document = await this.repository.findDocumentById(id);

    if (!document || document.status !== DocumentStatus.NEEDS_REVIEW) {
      throw new NotFoundException('Documento não encontrado ou não requer revisão.');
    }

    const now = new Date();
    
    // Se o claim existe, pertence a outra pessoa e não expirou, é um conflito (Fato g)
    if (
      document.reviewClaim &&
      document.reviewClaim.lockedBy !== dto.reviewerId &&
      document.reviewClaim.expiresAt > now
    ) {
      throw new ClaimConflictException();
    }

    // Trava de 5 minutos
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    return this.repository.upsertClaim(id, dto.reviewerId, now, expiresAt);
  }

  async correctDocument(id: string, dto: CorrectDocumentDto) {
    const document = await this.repository.findDocumentById(id);

    if (!document || document.status !== DocumentStatus.NEEDS_REVIEW) {
      throw new NotFoundException('Documento não encontrado ou não requer revisão.');
    }

    const now = new Date();

    if (!document.reviewClaim || document.reviewClaim.expiresAt < now) {
      throw new ClaimNotFoundException();
    }

    if (document.reviewClaim.lockedBy !== dto.reviewerId) {
      throw new ClaimForbiddenException();
    }

    // Executa a correção e atualiza para READY
    const [claim] = await this.repository.correctDocument(
      id,
      dto.correctedFields as any,
      dto.reviewerId,
      now,
    );

    return claim;
  }
}

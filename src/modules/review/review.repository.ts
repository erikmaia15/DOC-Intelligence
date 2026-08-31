import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNeedsReviewDocuments(now: Date) {
    return this.prisma.document.findMany({
      where: {
        status: DocumentStatus.NEEDS_REVIEW,
        OR: [
          { reviewClaim: null },
          { reviewClaim: { expiresAt: { lt: now } } },
        ],
      },
      include: {
        extractionResult: true,
        reviewClaim: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findDocumentById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: { reviewClaim: true },
    });
  }

  async upsertClaim(documentId: string, lockedBy: string, lockedAt: Date, expiresAt: Date) {
    return this.prisma.reviewClaim.upsert({
      where: { documentId },
      update: {
        lockedBy,
        lockedAt,
        expiresAt,
      },
      create: {
        documentId,
        lockedBy,
        lockedAt,
        expiresAt,
      },
    });
  }

  async correctDocument(documentId: string, correctedFields: Prisma.InputJsonValue, reviewedBy: string, reviewedAt: Date) {
    return this.prisma.$transaction([
      this.prisma.reviewClaim.update({
        where: { documentId },
        data: {
          correctedFields,
          reviewedBy,
          reviewedAt,
        },
      }),
      this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.READY,
        },
      }),
    ]);
  }
}

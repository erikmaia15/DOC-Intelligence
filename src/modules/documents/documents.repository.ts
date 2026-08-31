import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma, Document } from '@prisma/client';

@Injectable()
export class DocumentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async findByHash(hash: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { contentHash: hash },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: { extractionResult: true },
    });
  }

  async findMany(params: {
    where?: Prisma.DocumentWhereInput;
    orderBy?: Prisma.DocumentOrderByWithRelationInput;
  }): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: params.where,
      orderBy: params.orderBy,
    });
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository.js';
import 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  private readonly maxSizeBytes = 10 * 1024 * 1024; // 10MB
  private readonly storageDir = path.join(process.cwd(), 'storage');

  constructor(private readonly repository: DocumentsRepository) {}

  async uploadAndCreate(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo recebido na requisição.');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido (${file.mimetype}). Aceitamos apenas image/jpeg, image/png e application/pdf.`);
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException('O arquivo enviado excede o limite máximo de 10MB.');
    }

    // Calculando hash para o Dedupe (Fato C)
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const existingDoc = await this.repository.findByHash(hash);
    if (existingDoc) {
      // Retorna graciosa e imediatamente o já existente
      return existingDoc;
    }

    await fs.mkdir(this.storageDir, { recursive: true });

    // Salva arquivo com o hash como nome base
    const filename = `${hash}${path.extname(file.originalname)}`;
    const storagePath = path.join(this.storageDir, filename);
    await fs.writeFile(storagePath, file.buffer);

    const document = await this.repository.create({
      originalFilename: file.originalname,
      storageKey: storagePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      contentHash: hash,
      status: DocumentStatus.PENDING,
    });

    return document;
  }

  async findMany(status?: DocumentStatus) {
    const where = status ? { status } : {};
    return this.repository.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado.`);
    }
    return doc;
  }
}

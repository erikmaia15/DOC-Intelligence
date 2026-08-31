import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { DocumentsRepository } from './documents.repository.js';
import { ProcessingModule } from '../processing/processing.module.js';

@Module({
  imports: [ProcessingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
  exports: [DocumentsService], // Exported for the next module (Processing) to use
})
export class DocumentsModule {}

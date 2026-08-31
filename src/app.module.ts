import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from './config/config.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { ProcessingModule } from './modules/processing/processing.module.js';
import { ReviewModule } from './modules/review/review.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, DocumentsModule, AiModule, ProcessingModule, ReviewModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

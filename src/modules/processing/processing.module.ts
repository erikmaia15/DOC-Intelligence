import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProcessingProducer } from './processing.producer.js';
import { ProcessingConsumer } from './processing.consumer.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    AiModule,
  ],
  providers: [ProcessingProducer, ProcessingConsumer],
  exports: [ProcessingProducer],
})
export class ProcessingModule {}

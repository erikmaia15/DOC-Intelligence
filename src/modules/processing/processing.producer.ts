import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ProcessingProducer {
  private readonly logger = new Logger(ProcessingProducer.name);

  constructor(
    @InjectQueue('document-processing') private readonly processingQueue: Queue,
  ) {}

  async enqueue(documentId: string): Promise<void> {
    await this.processingQueue.add(
      'process-document',
      { documentId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    this.logger.log(`Document ${documentId} enfileirado para processamento`);
  }
}

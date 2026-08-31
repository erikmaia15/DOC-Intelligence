import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AI_PORT } from './ai.port.js';
import { StubAiAdapter } from './stub-ai.adapter.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_PORT,
      useClass: StubAiAdapter,
    },
  ],
  exports: [AI_PORT],
})
export class AiModule {}

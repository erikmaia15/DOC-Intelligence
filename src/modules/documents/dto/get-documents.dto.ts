import { IsEnum, IsOptional } from 'class-validator';
import { DocumentStatus } from '@prisma/client';

export class GetDocumentsQueryDto {
  @IsOptional()
  @IsEnum(DocumentStatus, {
    message: 'O status filtrado deve ser válido (ex: PENDING, PROCESSING, READY, NEEDS_REVIEW, FAILED)',
  })
  status?: DocumentStatus;
}

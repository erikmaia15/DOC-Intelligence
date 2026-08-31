import { IsEnum, IsOptional } from 'class-validator';
import { DocumentStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDocumentsQueryDto {
  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Filtrar documentos por status atual' })
  @IsOptional()
  @IsEnum(DocumentStatus, {
    message: 'O status filtrado deve ser válido (ex: PENDING, PROCESSING, READY, NEEDS_REVIEW, FAILED)',
  })
  status?: DocumentStatus;
}

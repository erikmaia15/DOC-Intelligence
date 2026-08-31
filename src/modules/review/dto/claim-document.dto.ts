import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimDocumentDto {
  @ApiProperty({ description: 'ID ou matrícula do revisor humano assumindo o documento', example: 'revisor-123' })
  @IsNotEmpty()
  @IsString()
  reviewerId: string;
}

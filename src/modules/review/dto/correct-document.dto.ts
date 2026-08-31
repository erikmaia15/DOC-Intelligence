import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CorrectDocumentDto {
  @ApiProperty({ description: 'ID ou matrícula do revisor (deve ser o mesmo que detém a trava)', example: 'revisor-123' })
  @IsNotEmpty()
  @IsString()
  reviewerId: string;

  @ApiProperty({ description: 'Objeto contendo os campos corrigidos após a revisão humana', example: { nome: 'João da Silva', dataNascimento: '1990-01-01' } })
  @IsNotEmpty()
  @IsObject()
  correctedFields: Record<string, any>;
}

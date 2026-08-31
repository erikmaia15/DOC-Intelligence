import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CorrectDocumentDto {
  @IsNotEmpty()
  @IsString()
  reviewerId: string;

  @IsNotEmpty()
  @IsObject()
  correctedFields: Record<string, any>;
}

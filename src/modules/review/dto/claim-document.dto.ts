import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimDocumentDto {
  @IsNotEmpty()
  @IsString()
  reviewerId: string;
}

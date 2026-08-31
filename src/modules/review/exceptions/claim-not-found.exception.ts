import { NotFoundException } from '@nestjs/common';

export class ClaimNotFoundException extends NotFoundException {
  constructor(message = 'Não há trava ativa (claim) para este documento.') {
    super(message);
  }
}

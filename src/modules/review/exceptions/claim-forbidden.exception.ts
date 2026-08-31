import { ForbiddenException } from '@nestjs/common';

export class ClaimForbiddenException extends ForbiddenException {
  constructor(message = 'Você não pode corrigir um documento reservado por outro revisor.') {
    super(message);
  }
}

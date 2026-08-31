import { ConflictException } from '@nestjs/common';

export class ClaimConflictException extends ConflictException {
  constructor(message = 'O documento já está reservado por outro revisor e a trava ainda não expirou.') {
    super(message);
  }
}

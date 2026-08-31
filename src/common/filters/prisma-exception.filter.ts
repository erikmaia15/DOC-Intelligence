import { ArgumentsHost, Catch, ConflictException, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    switch (exception.code) {
      case 'P2002':
        super.catch(
          new ConflictException('Conflito: Violação de restrição de unicidade (registro já existe ou está em uso).'),
          host,
        );
        break;
      case 'P2025':
        super.catch(
          new NotFoundException('Registro não encontrado para a operação solicitada.'),
          host,
        );
        break;
      default:
        super.catch(exception, host);
        break;
    }
  }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        return response.status(status).json({
          statusCode: status,
          message: 'Conflito: Violação de restrição de unicidade (registro já existe ou está em uso).',
          error: 'Conflict',
        });
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        return response.status(status).json({
          statusCode: status,
          message: 'Registro não encontrado para a operação solicitada.',
          error: 'Not Found',
        });
      }
      default: {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        return response.status(status).json({
          statusCode: status,
          message: 'Erro interno ao processar a requisição no banco de dados.',
          error: 'Internal Server Error',
        });
      }
    }
  }
}

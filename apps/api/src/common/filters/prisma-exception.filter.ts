import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal database error';

    // Prisma error codes mapping
    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on the field(s): ${exception.meta?.target || 'unknown'}`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed. Related record does not exist.';
        break;
      default:
        this.logger.error(
          `[500] Unhandled Prisma Error - Code: ${exception.code} - ${request.method} ${request.url}`,
          exception.stack,
        );
        break;
    }

    if (status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.warn(`[${status}] ${request.method} ${request.url} - ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      error: 'PrismaClientError',
      message,
    });
  }
}

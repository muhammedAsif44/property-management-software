import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error occurred';
    let errorType = 'InternalServerError';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as any;
      message = resObj.message || message;
      errorType = resObj.error || (exception as any)?.constructor?.name || 'HttpException';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.name;
    }

    // Log 500 internal errors with full stack trace for observability
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[500] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${status}] ${request.method} ${request.url} - ${Array.isArray(message) ? message.join(', ') : message}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

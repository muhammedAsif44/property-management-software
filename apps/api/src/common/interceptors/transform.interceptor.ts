import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data is already enveloped or has standard structure, return directly
        if (data && typeof data === 'object' && ('message' in data || 'redirectUrl' in data)) {
          return data;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

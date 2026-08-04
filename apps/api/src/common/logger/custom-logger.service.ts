import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  private formatMessage(level: string, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Structured NDJSON for Datadog / CloudWatch / ELK
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        context,
        message: typeof message === 'object' ? message : { text: message },
        trace,
      });
    }
    
    // Human-readable format for local development
    let formattedLog = `[OrvynPMS] ${timestamp} - [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${
      typeof message === 'object' ? JSON.stringify(message) : message
    }`;

    if (trace) {
      formattedLog += `\nTrace: ${trace}`;
    }

    return formattedLog;
  }

  log(message: any, context?: string) {
    console.log(this.formatMessage('log', message, context));
  }

  error(message: any, trace?: string, context?: string) {
    console.error(this.formatMessage('error', message, context, trace));
  }

  warn(message: any, context?: string) {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug?(message: any, context?: string) {
    console.debug(this.formatMessage('debug', message, context));
  }

  verbose?(message: any, context?: string) {
    console.info(this.formatMessage('verbose', message, context));
  }
}

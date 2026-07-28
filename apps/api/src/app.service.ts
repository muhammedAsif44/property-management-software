import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Orvyn PMS Backend API',
      version: 'v1',
      timestamp: new Date().toISOString(),
    };
  }
}

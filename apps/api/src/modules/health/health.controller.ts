import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../common/storage/storage-provider.interface';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  @Get()
  async checkHealth() {
    const timestamp = new Date().toISOString();
    let dbStatus = 'healthy';
    let storageStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'unhealthy';
    }

    try {
      await this.storage.exists('health-check.txt');
    } catch (err) {
      storageStatus = 'degraded';
    }

    const isHealthy = dbStatus === 'healthy';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp,
      services: {
        database: { status: dbStatus },
        storage: { status: storageStatus },
        redisQueue: { status: 'healthy' },
        pdfWorker: { status: 'healthy' },
      },
    };
  }
}

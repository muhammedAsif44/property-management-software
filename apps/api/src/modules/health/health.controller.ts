import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../common/storage/storage-provider.interface';
import { PdfQueueService } from '../invoices/services/pdf-queue.service';
import { PdfWorkerService } from '../invoices/services/pdf-worker.service';
import { PuppeteerBrowserService } from '../invoices/services/puppeteer-browser.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
    private readonly pdfQueueService: PdfQueueService,
    private readonly pdfWorkerService: PdfWorkerService,
    private readonly browserService: PuppeteerBrowserService,
  ) {}

  @Get()
  async checkHealth() {
    const timestamp = new Date().toISOString();
    let dbStatus = 'healthy';
    let storageStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    try {
      await this.storage.exists('health-check.txt');
    } catch {
      storageStatus = 'degraded';
    }

    const queueMetrics = await this.pdfQueueService.getHealthMetrics();
    const workerMetrics = this.pdfWorkerService.getWorkerMetrics();
    const isHealthy = dbStatus === 'healthy' && queueMetrics.redisStatus === 'healthy';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp,
      services: {
        database: { status: dbStatus },
        storage: { status: storageStatus },
        redisQueue: { status: queueMetrics.redisStatus },
        pdfWorker: { status: workerMetrics.isRunning ? 'running' : 'stopped' },
      },
    };
  }

  @Get('queue')
  async getQueueHealth() {
    const timestamp = new Date().toISOString();
    const queueMetrics = await this.pdfQueueService.getHealthMetrics();
    const workerMetrics = this.pdfWorkerService.getWorkerMetrics();
    const browserMetrics = this.browserService.getBrowserMetrics();

    return {
      timestamp,
      redisConnectionStatus: queueMetrics.redisStatus,
      redisPingLatencyMs: queueMetrics.pingLatencyMs,
      workerRunningStatus: workerMetrics.isRunning ? 'running' : 'stopped',
      currentWorkerConcurrency: workerMetrics.concurrency,
      workerUptimeSeconds: workerMetrics.workerUptimeSeconds,
      browserStatus: browserMetrics.status,
      queueStatus: queueMetrics.queueStatus,
      waitingJobs: queueMetrics.counts.waiting,
      activeJobs: queueMetrics.counts.active,
      completedJobs: queueMetrics.counts.completed,
      failedJobs: queueMetrics.counts.failed,
      queueBacklogAgeSeconds: queueMetrics.backlogAgeSeconds,
      memoryUsage: workerMetrics.memoryUsage,
      lastProcessedJobTimestamp: workerMetrics.lastProcessedTimestamp,
      productionMetrics: {
        ...workerMetrics.productionMetrics,
        browserRestartCount: browserMetrics.restartCount,
      },
    };
  }
}

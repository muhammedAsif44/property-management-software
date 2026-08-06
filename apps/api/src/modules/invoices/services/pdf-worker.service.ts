import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, QueueEvents, Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../../common/storage/storage-provider.interface';
import { InvoiceHtmlRendererService } from './invoice-html-renderer.service';
import { PuppeteerBrowserService } from './puppeteer-browser.service';
import { PdfQueueService, PdfJobPayload } from './pdf-queue.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class PdfWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfWorkerService.name);

  // Singleton Process Guard to guarantee only 1 Worker instance per Node process
  private static isWorkerInitialized = false;

  private worker: Worker<PdfJobPayload> | null = null;
  private queueEvents: QueueEvents | null = null;

  // Production Metrics Tracking
  private readonly startTimeMs = Date.now();
  private successCount = 0;
  private failureCount = 0;
  private retryCount = 0;
  private totalRenderTimeMs = 0;
  private totalQueueWaitTimeMs = 0;
  private totalUploadTimeMs = 0;
  private lastProcessedTimestamp: string | null = null;
  private isWorkerRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly pdfQueueService: PdfQueueService,
    private readonly htmlRenderer: InvoiceHtmlRendererService,
    private readonly browserService: PuppeteerBrowserService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider,
  ) {}

  async onModuleInit() {
    this.initWorker();
  }

  async onModuleDestroy() {
    await this.closeWorker();
  }

  private initWorker() {
    if (PdfWorkerService.isWorkerInitialized) {
      this.logger.log('PdfWorkerService is already initialized in this process. Skipping duplicate worker registration.');
      return;
    }

    try {
      const concurrency = this.configService.get<number>('WORKER_CONCURRENCY') || 1;
      const limiterMax = this.configService.get<number>('QUEUE_LIMITER_MAX') || 5;
      const limiterDuration = this.configService.get<number>('QUEUE_LIMITER_DURATION') || 10000;

      this.logger.log(`Initializing native BullMQ PDF Worker (Concurrency: ${concurrency}, Limiter: ${limiterMax} jobs / ${limiterDuration}ms)...`);

      // 1. Dedicated Redis Connection for Worker instance
      const workerConnection = this.pdfQueueService.createRedisConnectionOptions();

      this.worker = new Worker<PdfJobPayload>(
        'pdf-generation',
        async (job: Job<PdfJobPayload>) => {
          return this.processPdfJob(job);
        },
        {
          connection: workerConnection,
          concurrency,
          limiter: {
            max: limiterMax,
            duration: limiterDuration,
          },
        },
      );

      // 2. Dedicated Redis Connection for QueueEvents listener
      const eventsConnection = this.pdfQueueService.createRedisConnectionOptions();
      this.queueEvents = new QueueEvents('pdf-generation', { connection: eventsConnection });

      this.setupQueueEventListeners();

      PdfWorkerService.isWorkerInitialized = true;
      this.isWorkerRunning = true;
      this.logger.log('🟢 Native BullMQ Worker & QueueEvents listener initialized successfully with independent Redis connections.');
    } catch (err: any) {
      this.logger.error('Failed to initialize native BullMQ Worker:', err?.stack);
    }
  }

  private setupQueueEventListeners() {
    if (!this.queueEvents) return;

    this.queueEvents.on('waiting', ({ jobId }) => {
      this.logger.debug(`[QueueEvent:waiting] Job ID ${jobId} is waiting in queue.`);
    });

    this.queueEvents.on('active', ({ jobId, prev }) => {
      this.logger.log(`[QueueEvent:active] Job ID ${jobId} started processing (prev state: ${prev}).`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      this.logger.log(`[QueueEvent:progress] Job ID ${jobId} progress: ${data}%`);
    });

    this.queueEvents.on('completed', ({ jobId }) => {
      this.lastProcessedTimestamp = new Date().toISOString();
      this.successCount++;
      this.logger.log(`[QueueEvent:completed] Job ID ${jobId} completed successfully.`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.failureCount++;
      this.logger.error(`[QueueEvent:failed] Job ID ${jobId} failed: ${failedReason}`);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      this.logger.warn(`[QueueEvent:stalled] ⚠️ Job ID ${jobId} has stalled! Worker will re-attempt.`);
    });
  }

  /**
   * Main Job Processor Routine with Memory Protection, Versioning & Distributed Locking
   */
  private async processPdfJob(job: Job<PdfJobPayload>): Promise<{ url: string }> {
    const payload = job.data;
    const payloadVersion = payload.version || 1;
    const { invoiceId, bookingId, templateId, filename, enqueuedAt } = payload;
    const startTime = Date.now();

    if (job.attemptsMade > 0) {
      this.retryCount++;
    }

    if (enqueuedAt) {
      const waitTime = Math.max(0, Date.now() - new Date(enqueuedAt).getTime());
      this.totalQueueWaitTimeMs += waitTime;
    }

    this.logger.log(`[Job:${job.id}] Processing PDF generation (v${payloadVersion}) for Invoice ID: ${invoiceId}`);

    // 1. Worker Memory Protection Guard (75-80% Heap Threshold)
    if (this.browserService.isMemoryCritical() && this.worker) {
      this.logger.warn('⚠️ Critical memory threshold detected (>150MB heap)! Temporarily pausing Worker and recycling browser...');
      try {
        await this.worker.pause();
        await this.browserService.recycleBrowser();
        if (global.gc) {
          global.gc();
        }
      } catch (memErr: any) {
        this.logger.warn(`Error during memory protection recycle: ${memErr?.message}`);
      } finally {
        await this.worker.resume();
      }
    }

    // 2. Distributed Locking around Invoice PDF generation
    const lockAcquired = await this.pdfQueueService.acquireDistributedLock(invoiceId, 60);
    if (!lockAcquired) {
      this.logger.warn(`[Job:${job.id}] Concurrent generation lock active for Invoice ID: ${invoiceId}. Skipping duplicate run.`);
      throw new Error(`Invoice PDF generation lock is active for Invoice ID: ${invoiceId}`);
    }

    // 10% — Job Started
    await job.updateProgress(10);

    try {
      // 30% — Fetch Data & Render HTML via HTML Renderer Service
      const rendered = await this.htmlRenderer.renderInvoiceHtml(bookingId, templateId, filename);
      await job.updateProgress(30);

      // 50% — HTML Compiled
      await job.updateProgress(50);

      // 80% — Generate PDF Buffer via Puppeteer Browser Pool Service
      const renderStartTime = Date.now();
      const pdfBuffer = await this.browserService.renderPdfFromHtml(rendered.previewHtml);
      const pdfRenderTime = Date.now() - renderStartTime;
      this.totalRenderTimeMs += pdfRenderTime;
      await job.updateProgress(80);

      // 90% — Upload PDF to Cloudinary Storage Provider (with 3x retries & Circuit Breaker)
      const uploadStartTime = Date.now();
      const storageKey = `${filename}.pdf`;

      let uploadResult: { url: string; publicId?: string; bytes?: number };

      if (typeof this.storageProvider.uploadDetailed === 'function') {
        uploadResult = await this.storageProvider.uploadDetailed(storageKey, pdfBuffer, 'application/pdf');
      } else {
        const publicUrl = await this.storageProvider.upload(storageKey, pdfBuffer, 'application/pdf');
        uploadResult = { url: publicUrl, bytes: pdfBuffer.length };
      }
      const uploadTime = Date.now() - uploadStartTime;
      this.totalUploadTimeMs += uploadTime;
      await job.updateProgress(90);

      // 100% — Atomic Prisma DB Transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.READY,
            pdfUrl: uploadResult.url,
            jobId: job.id,
            cloudinaryPublicId: uploadResult.publicId || null,
            fileSize: uploadResult.bytes || pdfBuffer.length,
            generatedAt: new Date(),
            failureReason: null,
          },
        });
      });

      await job.updateProgress(100);

      const totalTime = Date.now() - startTime;
      const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

      this.logger.log(
        `✅ [Job:${job.id}] PDF Completed! Invoice ID: ${invoiceId} | PDF Render: ${pdfRenderTime}ms | Upload: ${uploadTime}ms | Total: ${totalTime}ms | Heap Memory: ${memUsage}MB | URL: ${uploadResult.url}`,
      );

      return { url: uploadResult.url };
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown PDF generation error';
      this.logger.error(`❌ [Job:${job.id}] PDF Generation failed for Invoice ID: ${invoiceId}: ${errorMessage}`, err?.stack);

      // On job exhaustion, update DB to FAILED and push to Dead Letter Queue (DLQ)
      if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
        this.logger.error(`Max retries exhausted for Invoice ID ${invoiceId}. Updating DB status to FAILED and moving to Dead Letter Queue.`);
        try {
          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.FAILED,
              failureReason: errorMessage,
              jobId: job.id,
            },
          });

          await this.pdfQueueService.pushToDeadLetterQueue(payload, errorMessage, job.attemptsMade + 1);
        } catch (dbErr: any) {
          this.logger.error(`Failed to record FAILED state in DB for Invoice ID ${invoiceId}:`, dbErr?.stack);
        }
      }

      throw err;
    } finally {
      await this.pdfQueueService.releaseDistributedLock(invoiceId);
    }
  }

  private async closeWorker() {
    this.isWorkerRunning = false;

    if (this.worker) {
      this.logger.log('Closing native BullMQ Worker...');
      try {
        await this.worker.close();
      } catch (err: any) {
        this.logger.warn(`Error closing BullMQ Worker: ${err?.message}`);
      } finally {
        this.worker = null;
      }
    }

    if (this.queueEvents) {
      try {
        await this.queueEvents.close();
      } catch (err: any) {
        this.logger.warn(`Error closing QueueEvents: ${err?.message}`);
      } finally {
        this.queueEvents = null;
      }
    }

    PdfWorkerService.isWorkerInitialized = false;
  }

  public getWorkerMetrics() {
    const totalProcessed = this.successCount + this.failureCount;
    const concurrency = this.configService.get<number>('WORKER_CONCURRENCY') || 1;
    const workerUptimeSeconds = Math.floor((Date.now() - this.startTimeMs) / 1000);

    const avgPdfGenerationTimeMs = totalProcessed > 0 ? Math.round(this.totalRenderTimeMs / totalProcessed) : 0;
    const avgQueueWaitTimeMs = totalProcessed > 0 ? Math.round(this.totalQueueWaitTimeMs / totalProcessed) : 0;
    const avgCloudinaryUploadTimeMs = totalProcessed > 0 ? Math.round(this.totalUploadTimeMs / totalProcessed) : 0;
    const successRate = totalProcessed > 0 ? `${((this.successCount / totalProcessed) * 100).toFixed(1)}%` : '100%';

    return {
      isRunning: this.isWorkerRunning,
      concurrency,
      workerUptimeSeconds,
      lastProcessedTimestamp: this.lastProcessedTimestamp,
      productionMetrics: {
        successCount: this.successCount,
        failureCount: this.failureCount,
        retryCount: this.retryCount,
        successRate,
        avgPdfGenerationTimeMs,
        avgQueueWaitTimeMs,
        avgCloudinaryUploadTimeMs,
      },
      memoryUsage: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
  }
}

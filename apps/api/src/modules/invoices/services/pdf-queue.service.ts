import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

export interface PdfJobPayload {
  version: 1;
  invoiceId: string;
  bookingId: string;
  idempotencyKey?: string;
  templateId?: string;
  filename: string;
  enqueuedAt: string;
}

@Injectable()
export class PdfQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfQueueService.name);
  private queue: Queue<PdfJobPayload> | null = null;
  private dlq: Queue<any> | null = null;
  private redisLockClient: Redis | null = null;
  private isRedisHealthy = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initQueue();
    this.initLockClient();
  }

  async onModuleDestroy() {
    if (this.queue) {
      this.logger.log('Closing BullMQ PDF Queue instance...');
      try {
        await this.queue.close();
      } catch (err: any) {
        this.logger.warn(`Error closing BullMQ Queue: ${err?.message}`);
      }
    }

    if (this.dlq) {
      try {
        await this.dlq.close();
      } catch (err: any) {
        this.logger.warn(`Error closing Dead Letter Queue: ${err?.message}`);
      }
    }

    if (this.redisLockClient) {
      try {
        this.redisLockClient.disconnect();
      } catch {}
    }
  }

  /**
   * Factory returning fresh Redis ConnectionOptions for each independent component
   */
  public createRedisConnectionOptions(): ConnectionOptions {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: Number(url.port) || 6379,
        username: url.username || undefined,
        password: url.password || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        keepAlive: 10000,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 1000, 15000);
          this.logger.warn(`[Redis] Reconnecting with exponential backoff (Attempt #${times}, Delay: ${delay}ms)`);
          return delay;
        },
      };
    }

    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const useTls = this.configService.get<boolean>('REDIS_TLS') || false;

    return {
      host,
      port,
      password: password || undefined,
      tls: useTls ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 1000, 15000);
        this.logger.warn(`[Redis] Reconnecting with exponential backoff (Attempt #${times}, Delay: ${delay}ms)`);
        return delay;
      },
    };
  }

  private initQueue() {
    if (this.queue) return;

    try {
      // 1. Separate Redis connection for Queue Producer
      const connection = this.createRedisConnectionOptions();
      this.queue = new Queue<PdfJobPayload>('pdf-generation', {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: { age: 3600, count: 100 },
          removeOnFail: { age: 86400, count: 500 },
        },
      });

      // 2. Separate Redis connection for Dead Letter Queue (DLQ)
      const dlqConnection = this.createRedisConnectionOptions();
      this.dlq = new Queue<any>('pdf-generation-dlq', {
        connection: dlqConnection,
      });

      this.queue.client.then((client: any) => {
        if (client && typeof client.on === 'function') {
          this.isRedisHealthy = true;
          client.on('ready', () => {
            this.isRedisHealthy = true;
            this.logger.log('🟢 [Redis] Connection established for Queue Producer.');
          });
          client.on('error', (err: any) => {
            this.isRedisHealthy = false;
            this.logger.error(`🔴 [Redis] Error on Queue Producer connection: ${err?.message || err}`);
          });
          client.on('close', () => {
            this.isRedisHealthy = false;
            this.logger.warn('🟡 [Redis] Queue connection closed.');
          });
        }
      }).catch(() => {});
    } catch (err: any) {
      this.logger.error('Failed to initialize native BullMQ Queue:', err?.stack);
    }
  }

  private initLockClient() {
    if (this.redisLockClient) return;
    try {
      const conn: any = this.createRedisConnectionOptions();
      this.redisLockClient = new Redis({
        host: conn.host,
        port: conn.port,
        password: conn.password,
        tls: conn.tls,
        lazyConnect: true,
      });
      this.redisLockClient.connect().catch(() => {});
    } catch {}
  }

  /**
   * Distributed Lock Acquisition (Redis SET NX EX)
   */
  async acquireDistributedLock(lockKey: string, ttlSeconds = 60): Promise<boolean> {
    if (!this.redisLockClient) this.initLockClient();
    if (!this.redisLockClient) return true; // Fallback if lock client uninitialized

    try {
      const result = await this.redisLockClient.set(`lock:${lockKey}`, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return true; // Fallback to database transaction safety on Redis error
    }
  }

  /**
   * Distributed Lock Release
   */
  async releaseDistributedLock(lockKey: string): Promise<void> {
    if (!this.redisLockClient) return;
    try {
      await this.redisLockClient.del(`lock:${lockKey}`);
    } catch {}
  }

  /**
   * Enqueue PDF generation job with versioned payload and idempotency key
   */
  async enqueuePdfJob(payload: Omit<PdfJobPayload, 'version' | 'enqueuedAt'>): Promise<string> {
    if (!this.queue) {
      this.initQueue();
    }

    if (!this.queue) {
      throw new Error('BullMQ Queue is unavailable');
    }

    const versionedPayload: PdfJobPayload = {
      ...payload,
      version: 1,
      enqueuedAt: new Date().toISOString(),
    };

    const jobId = payload.idempotencyKey || payload.invoiceId;

    try {
      const job = await this.queue.add('generate-pdf', versionedPayload, {
        jobId,
      });

      this.logger.log(`Enqueued PDF job (v1) -> Job ID: ${job.id} | Invoice ID: ${payload.invoiceId}`);
      return job.id || jobId;
    } catch (err: any) {
      this.logger.error(`Failed to enqueue PDF job for Invoice ID ${payload.invoiceId}:`, err?.stack);
      throw err;
    }
  }

  /**
   * Move failed job to Dead Letter Queue (DLQ) after retries are exhausted
   */
  async pushToDeadLetterQueue(payload: PdfJobPayload, failedReason: string, attemptsMade: number): Promise<void> {
    if (!this.dlq) this.initQueue();
    if (!this.dlq) return;

    try {
      await this.dlq.add('failed-pdf-job', {
        payload,
        failedReason,
        attemptsMade,
        failedAt: new Date().toISOString(),
      });
      this.logger.log(`📦 Moved failed PDF job for Invoice ID ${payload.invoiceId} to Dead Letter Queue (DLQ).`);
    } catch (err: any) {
      this.logger.error(`Failed to push job to Dead Letter Queue for Invoice ID ${payload.invoiceId}:`, err?.stack);
    }
  }

  /**
   * Fetch BullMQ job status and progress (0-100%)
   */
  async getJobStatus(jobId: string) {
    if (!this.queue) return null;
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      const progress = job.progress;
      const failedReason = job.failedReason;

      return {
        id: job.id,
        state,
        progress: typeof progress === 'number' ? progress : 0,
        failedReason: failedReason || null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Measure Redis ping latency in milliseconds
   */
  async pingRedisLatencyMs(): Promise<number | null> {
    if (!this.redisLockClient) return null;
    const start = Date.now();
    try {
      await this.redisLockClient.ping();
      return Date.now() - start;
    } catch {
      return null;
    }
  }

  /**
   * Calculate backlog age in seconds of the oldest waiting job in the queue
   */
  async getOldestWaitingJobAgeSeconds(): Promise<number> {
    if (!this.queue) return 0;
    try {
      const waitingJobs = await this.queue.getWaiting(0, 0);
      if (waitingJobs.length === 0) return 0;

      const oldestJob = waitingJobs[0];
      const timestamp = oldestJob.timestamp;
      if (!timestamp) return 0;

      return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    } catch {
      return 0;
    }
  }

  /**
   * Get queue health metrics for /health/queue endpoint
   */
  async getHealthMetrics() {
    if (!this.queue) {
      return {
        redisStatus: 'unhealthy',
        queueStatus: 'uninitialized',
        counts: { waiting: 0, active: 0, completed: 0, failed: 0 },
        pingLatencyMs: null,
        backlogAgeSeconds: 0,
      };
    }

    try {
      const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed');
      const isPaused = await this.queue.isPaused();
      const pingLatencyMs = await this.pingRedisLatencyMs();
      const backlogAgeSeconds = await this.getOldestWaitingJobAgeSeconds();

      return {
        redisStatus: this.isRedisHealthy ? 'healthy' : 'degraded',
        queueStatus: isPaused ? 'paused' : 'active',
        counts,
        pingLatencyMs,
        backlogAgeSeconds,
      };
    } catch {
      return {
        redisStatus: 'unhealthy',
        queueStatus: 'error',
        counts: { waiting: 0, active: 0, completed: 0, failed: 0 },
        pingLatencyMs: null,
        backlogAgeSeconds: 0,
      };
    }
  }
}

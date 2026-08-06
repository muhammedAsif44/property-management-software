import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { IStorageProvider, StorageUploadResult } from './storage-provider.interface';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  // Circuit Breaker State
  private consecutiveFailures = 0;
  private circuitState: 'CLOSED' | 'OPEN' = 'CLOSED';
  private circuitOpenedAt: number | null = null;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly CIRCUIT_COOLDOWN_MS = 60000; // 60 seconds cooldown

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log(`Cloudinary Storage Provider initialized for cloud: ${cloudName}`);
    } else {
      this.logger.warn(
        'Cloudinary credentials not fully specified in environment. Calls will fail unless configured.',
      );
    }
  }

  private checkCircuitBreaker(): void {
    if (this.circuitState === 'OPEN') {
      const now = Date.now();
      if (this.circuitOpenedAt && now - this.circuitOpenedAt > this.CIRCUIT_COOLDOWN_MS) {
        this.logger.log('Cloudinary Circuit Breaker cooldown elapsed. Transitioning to HALF-OPEN state.');
        this.circuitState = 'CLOSED';
        this.consecutiveFailures = 0;
        this.circuitOpenedAt = null;
      } else {
        const remainingSeconds = Math.ceil(
          (this.CIRCUIT_COOLDOWN_MS - (now - (this.circuitOpenedAt || now))) / 1000,
        );
        throw new Error(
          `Cloudinary Circuit Breaker is OPEN due to ${this.MAX_CONSECUTIVE_FAILURES} consecutive failures. Fast-failing uploads for another ${remainingSeconds}s.`,
        );
      }
    }
  }

  private recordFailure(err: any): void {
    this.consecutiveFailures += 1;
    this.logger.error(
      `Cloudinary upload failure (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES}): ${err?.message || err}`,
    );

    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.circuitState = 'OPEN';
      this.circuitOpenedAt = Date.now();
      this.logger.error(
        `🚨 Cloudinary Circuit Breaker OPENED! Halting Cloudinary upload attempts for ${this.CIRCUIT_COOLDOWN_MS / 1000} seconds.`,
      );
    }
  }

  private recordSuccess(): void {
    if (this.consecutiveFailures > 0) {
      this.logger.log('Cloudinary upload succeeded. Resetting Circuit Breaker failure counter.');
    }
    this.consecutiveFailures = 0;
    this.circuitState = 'CLOSED';
    this.circuitOpenedAt = null;
  }

  /**
   * Upload Buffer to Cloudinary as RAW file with 3x retry resilience
   */
  async uploadDetailed(key: string, body: Buffer, mimeType = 'application/pdf'): Promise<StorageUploadResult> {
    this.checkCircuitBreaker();

    const maxRetries = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          const fullKey = key.endsWith('.pdf') ? key : `${key}.pdf`;
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              public_id: fullKey,
              folder: 'orvyn-pms/invoices',
              overwrite: true,
            },
            (error, response) => {
              if (error || !response) {
                return reject(error || new Error('Empty response from Cloudinary upload'));
              }
              resolve(response);
            },
          );

          const stream = new Readable();
          stream.push(body);
          stream.push(null);
          stream.pipe(uploadStream);
        });

        this.recordSuccess();
        return {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
        };
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Cloudinary upload attempt ${attempt}/${maxRetries} failed: ${err?.message || err}`);
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    this.recordFailure(lastError);
    throw lastError || new Error(`Cloudinary upload failed after ${maxRetries} attempts`);
  }

  async upload(key: string, body: Buffer, mimeType = 'application/pdf'): Promise<string> {
    const res = await this.uploadDetailed(key, body, mimeType);
    return res.url;
  }

  async download(key: string): Promise<Buffer> {
    const publicUrl = await this.getPublicUrl(key);
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Failed to download asset from Cloudinary: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const publicId = `orvyn-pms/invoices/${key.replace(/\.[^/.]+$/, '')}`;
      const result = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
      return !!result;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const publicId = `orvyn-pms/invoices/${key.replace(/\.[^/.]+$/, '')}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

  async getPublicUrl(key: string): Promise<string> {
    const publicId = `orvyn-pms/invoices/${key.replace(/\.[^/.]+$/, '')}`;
    return cloudinary.url(publicId, { resource_type: 'raw', secure: true });
  }
}

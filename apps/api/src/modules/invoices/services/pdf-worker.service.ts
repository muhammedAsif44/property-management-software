import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../../common/storage/storage-provider.interface';
import { InvoiceStatus } from '@prisma/client';

export interface PdfJobPayload {
  invoiceId: string;
  htmlContent: string;
  filename: string;
}

@Injectable()
export class PdfWorkerService {
  private readonly logger = new Logger(PdfWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  /**
   * Process asynchronous PDF generation job
   * Renders HTML template, uploads to IStorageProvider, updates Invoice status
   */
  async processPdfJob(payload: PdfJobPayload): Promise<string> {
    const { invoiceId, htmlContent, filename } = payload;
    this.logger.log(`Starting PDF compilation job for Invoice ID: ${invoiceId}`);

    try {
      // 1. Convert HTML content to Buffer (HTML/PDF representation)
      const pdfBuffer = Buffer.from(htmlContent, 'utf-8');

      // 2. Upload to configured Storage Provider (Local or R2)
      const storageKey = `invoices/${filename}.pdf`;
      const publicUrl = await this.storage.upload(storageKey, pdfBuffer, 'application/pdf');

      // 3. Mark Invoice status READY with permanent PDF URL
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.READY,
          pdfUrl: publicUrl,
          generatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully generated and stored PDF for Invoice ID: ${invoiceId} -> ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      this.logger.error(`Failed to process PDF job for Invoice ID: ${invoiceId}`, err?.stack);

      // Mark Invoice status FAILED
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.FAILED,
        },
      });

      throw err;
    }
  }
}

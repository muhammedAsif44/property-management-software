import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceHtmlRendererService } from './services/invoice-html-renderer.service';
import { PuppeteerBrowserService } from './services/puppeteer-browser.service';
import { PdfQueueService } from './services/pdf-queue.service';
import { PdfWorkerService } from './services/pdf-worker.service';

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoiceHtmlRendererService,
    PuppeteerBrowserService,
    PdfQueueService,
    PdfWorkerService,
  ],
  exports: [
    InvoicesService,
    InvoiceHtmlRendererService,
    PuppeteerBrowserService,
    PdfQueueService,
    PdfWorkerService,
  ],
})
export class InvoicesModule {}

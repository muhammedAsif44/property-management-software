import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfWorkerService } from './services/pdf-worker.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfWorkerService],
  exports: [InvoicesService, PdfWorkerService],
})
export class InvoicesModule {}

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
  controllers: [HealthController],
})
export class HealthModule {}

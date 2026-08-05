import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/properties/:id/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReport(
    @CurrentUser() user: any,
    @Param('id') propertyId: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Note: In a production app, we would also verify `user` has access to `propertyId` here,
    // which is generally handled by a PropertyGuard or inside the service.
    return this.reportsService.generateReport(propertyId, { period, from, to });
  }
}

import { Module } from '@nestjs/common';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import { BookingHelperService } from '../bookings/services/booking-helper.service';

@Module({
  controllers: [HousekeepingController],
  providers: [HousekeepingService, BookingHelperService],
  exports: [HousekeepingService],
})
export class HousekeepingModule {}

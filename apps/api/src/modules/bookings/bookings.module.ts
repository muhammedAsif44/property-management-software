import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { GuestService } from './services/guest.service';
import { BookingHelperService } from './services/booking-helper.service';
import { BookingCreationService } from './services/booking-creation.service';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingDeletionService } from './services/booking-deletion.service';
import { BookingOccupancyService } from './services/booking-occupancy.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    GuestService,
    BookingHelperService,
    BookingCreationService,
    BookingLifecycleService,
    BookingDeletionService,
    BookingOccupancyService,
  ],
  exports: [
    BookingsService,
    GuestService,
    BookingHelperService,
    BookingCreationService,
    BookingLifecycleService,
    BookingDeletionService,
    BookingOccupancyService,
  ],
})
export class BookingsModule {}

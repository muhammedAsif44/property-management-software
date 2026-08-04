import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StaffModule } from './modules/staff/staff.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global rate limiting: 500 requests per 60 seconds per IP
    // (B2B SaaS SPAs make many parallel requests on page load)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 500,
    }]),

    PrismaModule,
    AuthModule,
    AdminModule,
    PropertiesModule,
    AnalyticsModule,
    StaffModule,
    BookingsModule,
    HousekeepingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}


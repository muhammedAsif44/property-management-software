import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyOnboardingService } from './services/property-onboarding.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyOnboardingService],
  exports: [PropertiesService, PropertyOnboardingService],
})
export class PropertiesModule {}

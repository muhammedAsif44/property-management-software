import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyOnboardingService } from './services/property-onboarding.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller({ path: 'properties', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly onboardingService: PropertyOnboardingService,
  ) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getMyProperties(@Req() req: any) {
    return this.propertiesService.getMyProperties(req.user.id);
  }

  @Get('active')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getActiveProperty(@Req() req: any) {
    return this.propertiesService.getActiveProperty(req.user.id);
  }

  @Get(':id/onboarding')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getOnboardingData(@Req() req: any, @Param('id') id: string) {
    return this.onboardingService.getOnboardingData(req.user.id, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async createProperty(@Req() req: any, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.createProperty(req.user.id, dto);
  }

  @Post(':id/onboarding/step')
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async saveOnboardingStep(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.onboardingService.saveOnboardingStep(req.user.id, id, dto);
  }

  @Patch('switch/:propertyId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async switchActiveProperty(@Req() req: any, @Param('propertyId') propertyId: string) {
    return this.propertiesService.switchActiveProperty(req.user.id, propertyId);
  }
}

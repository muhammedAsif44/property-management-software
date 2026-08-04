import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
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
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.VIEWER, UserRole.SUPER_ADMIN)
  async getMyProperties(@CurrentUser() user: AuthUser) {
    return this.propertiesService.getMyProperties(user.id);
  }

  @Get('active')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.VIEWER, UserRole.SUPER_ADMIN)
  async getActiveProperty(@CurrentUser() user: AuthUser) {
    return this.propertiesService.getActiveProperty(user.id);
  }

  @Get(':id/onboarding')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.HOUSEKEEPING, UserRole.SUPER_ADMIN)
  async getOnboardingData(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.onboardingService.getOnboardingData(user.id, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async createProperty(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.createProperty(user.id, dto);
  }

  @Post(':id/onboarding/step')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async saveOnboardingStep(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.onboardingService.saveOnboardingStep(user.id, id, dto);
  }

  @Patch('switch/:propertyId')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.VIEWER, UserRole.SUPER_ADMIN)
  async switchActiveProperty(@CurrentUser() user: AuthUser, @Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.propertiesService.switchActiveProperty(user.id, propertyId);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller({ path: 'guests', version: '1' })
@UseGuards(JwtAuthGuard)
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('propertyId') propertyId: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.guestsService.findAll(user.id, propertyId, { search, page, limit });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('propertyId') propertyId: string,
  ) {
    return this.guestsService.findOne(user.id, propertyId, id);
  }
}

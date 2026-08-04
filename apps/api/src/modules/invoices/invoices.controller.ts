import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller({ version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * POST /api/v1/bookings/:id/invoice
   * Issue final invoice with sequential numbering (Reception, Manager, Owner)
   */
  @Post('bookings/:id/invoice')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async issueInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.invoicesService.issueInvoice(user.id, id, idempotencyKey);
  }

  /**
   * POST /api/v1/bookings/:id/invoice/preview
   * Live invoice HTML/PDF preview (Never saved permanently)
   */
  @Post('bookings/:id/invoice/preview')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async generatePreview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('templateId') templateId?: string,
    @Query('isAgency') isAgency?: string,
  ) {
    return this.invoicesService.generatePreview(
      user.id,
      id,
      templateId,
      isAgency === 'true',
    );
  }

  /**
   * GET /api/v1/invoices/:id/download
   * Stream compiled PDF file securely with proper headers
   */
  @Get('invoices/:id/download')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION_STAFF, UserRole.SUPER_ADMIN)
  async downloadInvoice(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    return this.invoicesService.downloadInvoice(user.id, id, res);
  }

  /**
   * GET /api/v1/invoice-templates
   * List custom invoice templates
   */
  @Get('invoice-templates')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getTemplates(@CurrentUser() user: AuthUser) {
    return this.invoicesService.getTemplates(user.id);
  }

  /**
   * POST /api/v1/invoice-templates
   * Save template draft (Owner ONLY!)
   */
  @Post('invoice-templates')
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async saveDraftTemplate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.invoicesService.saveDraftTemplate(user.id, dto);
  }

  /**
   * POST /api/v1/invoice-templates/:id/publish
   * Publish template version (Owner ONLY!)
   */
  @Post('invoice-templates/:id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.SUPER_ADMIN)
  async publishTemplate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.publishTemplate(user.id, id);
  }
}

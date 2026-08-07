import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { OtaChannelService } from './ota-channel.service';
import { ConnectOtaChannelDto, SyncAriDto } from './dto/connect-ota-channel.dto';
import { OtaWebhookPayloadDto } from './dto/ota-webhook-payload.dto';

@Controller('ota')
export class OtaChannelController {
  constructor(private readonly otaChannelService: OtaChannelService) {}

  @Get('channels')
  async getChannels(@Query('propertyId') propertyId: string) {
    return this.otaChannelService.getPropertyChannels(propertyId);
  }

  @Post('connect')
  async connectChannel(
    @Query('propertyId') propertyId: string,
    @Body() dto: ConnectOtaChannelDto,
  ) {
    return this.otaChannelService.connectChannel(propertyId, dto);
  }

  @Post('sync-ari')
  async syncAri(
    @Query('propertyId') propertyId: string,
    @Body() dto: SyncAriDto,
  ) {
    return this.otaChannelService.syncAri(propertyId, dto);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: OtaWebhookPayloadDto) {
    return this.otaChannelService.handleIncomingWebhook(payload);
  }
}

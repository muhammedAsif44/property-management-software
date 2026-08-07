import { Module } from '@nestjs/common';
import { OtaChannelService } from './ota-channel.service';
import { OtaChannelController } from './ota-channel.controller';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OtaChannelController],
  providers: [OtaChannelService],
  exports: [OtaChannelService],
})
export class OtaChannelModule {}

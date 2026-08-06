import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('STORAGE_PROVIDER')?.toLowerCase();
        if (provider === 'r2' || provider === 's3') {
          return new R2StorageProvider(configService);
        }
        // Cloudinary is the primary storage provider for PDF generation and assets
        return new CloudinaryStorageProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}

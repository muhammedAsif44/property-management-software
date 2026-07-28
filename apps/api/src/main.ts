import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable Global API Prefix & URI Versioning (/api/v1/...)
  const prefix = process.env.API_PREFIX || 'api';
  const defaultVersion = process.env.API_VERSION || '1';

  app.setGlobalPrefix(prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  // 2. CORS configuration
  const origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Global Pipe for Validation & DTO Transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Start Server
  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Orvyn PMS Backend API is running on: http://localhost:${port}/${prefix}/v${defaultVersion}`);
}

bootstrap();

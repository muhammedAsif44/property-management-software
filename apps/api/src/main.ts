import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cookie Parser middleware
  const cookieSecret = process.env.COOKIE_SECRET || 'orvyn_cookie_secret_key_2026';
  app.use(cookieParser(cookieSecret));

  // 2. Enable Global API Prefix & URI Versioning (/api/v1/...)
  const prefix = process.env.API_PREFIX || 'api';
  const defaultVersion = process.env.API_VERSION || '1';

  app.setGlobalPrefix(prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  // 3. CORS configuration (allowing credentials for HTTP-only cookies)
  const origins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 4. Global Pipe for Validation & DTO Transformation
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

  // 5. Start Server
  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Orvyn PMS Backend API is running on: http://localhost:${port}/${prefix}/v${defaultVersion}`);
}

bootstrap();

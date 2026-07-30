import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 0. Helmet: HTTP security headers (XSS, clickjacking, MIME sniffing protection)
  app.use(helmet());
  const cookieSecret = process.env.COOKIE_SECRET || 'orvyn_cookie_secret_key_2026';
  app.use(cookieParser(cookieSecret));

  // 1. Enable Global API Prefix & URI Versioning (/api/v1/...)
  const prefix = process.env.API_PREFIX || 'api';
  const defaultVersion = process.env.API_VERSION || '1';

  app.setGlobalPrefix(prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  // 2. CORS configuration (allowing credentials for HTTP-only cookies)
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

  // 4. Global Exception Filter & Response Transform Interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 5. Start Server
  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Orvyn PMS Backend API is running on: http://localhost:${port}/${prefix}/v${defaultVersion}`);
}

bootstrap();

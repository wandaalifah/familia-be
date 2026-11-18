import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { getJwtSecret } from './common/config/jwt-secret';

// Comma-separated list of allowed browser origins, e.g. "https://admin.example.com"
const parseCorsOrigins = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

async function bootstrap() {
  getJwtSecret(); // fail fast when the signing secret is missing or weak

  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule);

  // Swagger UI needs inline scripts, so CSP is only enforced in production (UI is off there)
  app.use(helmet({ contentSecurityPolicy: isProduction }));

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins, credentials: true });
  }

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // API docs are not exposed in production
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Familia API')
      .setDescription('Familia Backend API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './modules/logger/logger.service';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get services
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Use custom logger
  app.useLogger(logger);

  // Security middleware
  app.use(helmet());

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ].filter(Boolean); // remove undefined/null values

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
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

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  // if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('POS System API')
    .setDescription('Point of Sale System REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    // .addTag('auth', 'Authentication endpoints')
    // .addTag('products', 'Product management endpoints')
    // .addTag('sales', 'Sales management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  logger.log('Swagger documentation available at /api/docs', 'Bootstrap');
  // }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  const port = Number(configService.get('PORT')) || 3001;
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `>>> Swagger docs: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
  logger.log(`>>> Health check: http://localhost:${port}/health`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

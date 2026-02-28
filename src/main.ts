import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
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

  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  const config = new DocumentBuilder()
    .setTitle('Cangkir Mini Soccer Booking API')
    .setDescription(
      'RESTful API for mini soccer field booking system with guest booking and admin management',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter admin JWT token',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Time Slots', 'Public time slot endpoints')
    .addTag('Bookings', 'Public booking endpoints')
    .addTag('Admin Auth', 'Admin authentication')
    .addTag('Admin Dashboard', 'Admin dashboard statistics')
    .addTag('Admin Bookings', 'Admin booking management')
    .addTag('Admin Time Slots', 'Admin time slot management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Cangkir Mini Soccer API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  const logger = app.get(Logger);
  logger.log(`Application running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  logger.log(` Environment: ${process.env.NODE_ENV || 'development'}`);

  // graceful shutdown
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`${signal} received again, forcefully exiting...`);
      process.exit(1);
    }

    isShuttingDown = true;
    logger.log(`${signal} signal received: closing HTTP server`);

    try {
      await app.close();
      logger.log('HTTP server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  process.once('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.once('SIGINT', () => void gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

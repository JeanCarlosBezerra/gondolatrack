  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';
  import { ValidationPipe } from '@nestjs/common';
  import cookieParser from 'cookie-parser';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    app.use(cookieParser()); // ✅ ADICIONAR

    app.enableCors({
      origin: ['http://localhost:3000', 'http://172.28.7.6:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await app.listen(port, "0.0.0.0");
  }
  bootstrap();

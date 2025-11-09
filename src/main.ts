import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 4000);
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
}
bootstrap();

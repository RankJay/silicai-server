import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const config = app.get<ConfigService>(ConfigService);
  app.enableCors({
    credentials: true,
    origin: [/.*vercel\.app$/, 'http://localhost:3000'],
    methods: 'GET,POST,OPTIONS',
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Accept, Authorization, Content-Type, Observe, os',
  });
  await app.listen(3000);
  console.log(`Application is running: ${await app.getUrl()}`);
  console.log(`Microservice is running: ${8000}`);
}
bootstrap();

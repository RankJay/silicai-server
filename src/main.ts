import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: [
      /.*vercel\.app$/,
      'https://silic.ai',
      'https://www.silic.ai',
      'http://localhost:3000',
    ],
    methods: 'GET,POST,OPTIONS',
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe, Authorization, os',
  });
  await app.listen(3001);
  console.log(`Application is running: ${await app.getUrl()}`);
  console.log(`Microservice is running: ${8000}`);
}
bootstrap();

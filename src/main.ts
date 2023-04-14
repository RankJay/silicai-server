import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "src/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.init();

  const config = app.get<ConfigService>(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: config.get<number>("microservicePort"),
      host: "0.0.0.0",
    },
  });
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT);
  await app.startAllMicroservices();

  console.log(`Twitter Bot Project initiated!`);
}
bootstrap();

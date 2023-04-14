import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import configuration from "./common/config/configuration";
import { BotModule } from "./modules/bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

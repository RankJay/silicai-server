import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { BotController } from "src/modules/bot.controller";
import { BotService } from "src/modules/bot.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}

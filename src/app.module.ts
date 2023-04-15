import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvConfig } from './common/config/env';
import { AppService } from './app.service';

@Module({
  imports: [EnvConfig],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

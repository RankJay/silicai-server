import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvConfig } from './common/config/env';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, EnvConfig],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

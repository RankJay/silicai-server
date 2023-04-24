import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvConfig } from './common/config/env';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { FetchModule } from 'nestjs-fetch';

@Module({
  imports: [HttpModule, EnvConfig, FetchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

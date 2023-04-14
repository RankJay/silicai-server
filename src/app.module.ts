import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { InventoryModule } from './inventory/inventory.module';
import { DatabaseConfig } from './common/config/database';
import { EnvConfig } from './common/config/env';

@Module({
  imports: [UserModule, InventoryModule, DatabaseConfig, EnvConfig],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

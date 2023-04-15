import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { EnvConfig } from './common/config/env';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [UserModule, InventoryModule, EnvConfig],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

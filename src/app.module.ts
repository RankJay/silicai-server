import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { InventoryModule } from './inventory/inventory.module';
import { DatabaseConfig } from './common/config/database';

@Module({
  imports: [UserModule, InventoryModule, DatabaseConfig],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

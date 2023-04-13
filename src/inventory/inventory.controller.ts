import { Controller, Get, HttpCode } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly InventoryService: InventoryService) {}

  @Get('/health')
  @HttpCode(200)
  healthStatus() {
    return;
  }
}

import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SilicUserInventory } from './inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('/')
  @HttpCode(200)
  async getUser() {
    return await this.inventoryService.getUserInventory({});
  }

  @Post('/create')
  @HttpCode(200)
  async createUser(@Body() createUser: SilicUserInventory) {
    return await this.inventoryService.addToUserInventory(createUser);
  }
}

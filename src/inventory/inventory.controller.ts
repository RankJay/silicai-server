import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SilicUserInventory } from './inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('/')
  @HttpCode(200)
  async getAllUserInventory() {
    return await this.inventoryService.getAllUserInventory();
  }

  @Post('/get')
  @HttpCode(200)
  async getUserInventory(@Body() body: { id: string }) {
    return await this.inventoryService.getUserInventory(body.id);
  }

  @Post('/create')
  @HttpCode(200)
  async createUserInventory(@Body() createUserInventory: SilicUserInventory) {
    return await this.inventoryService.addToUserInventory(createUserInventory);
  }
}

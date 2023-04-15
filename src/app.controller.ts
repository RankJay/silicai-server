import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { SilicUserInventory } from './inventory/inventory.dto';
import { AppService } from './app.service';
import { SilicUser } from './user/user.dto';

@Controller()
export class AppController {
  check: boolean;
  constructor(private readonly appService: AppService) {
    this.check = true;
  }

  @Get('/health')
  @HttpCode(200)
  healthStatus() {
    if (this.check) {
      return {
        check: this.check,
      };
    }
  }

  @Get('/user/')
  @HttpCode(200)
  async getAllUser() {
    return await this.appService.getAllUsers();
  }

  @Get('/inventory/')
  @HttpCode(200)
  async getAllUserInventory() {
    return await this.appService.getAllUserInventory();
  }

  @Post('/inventory/get')
  @HttpCode(200)
  async getUserInventory(@Body() body: { id: string }) {
    return await this.appService.getUserInventory(body.id);
  }

  @Post('/user/get')
  @HttpCode(200)
  async getUser(@Body() body: { email: string }) {
    return await this.appService.getUser(body.email);
  }

  @Post('/inventory/create')
  @HttpCode(200)
  async createUserInventory(@Body() createUserInventory: SilicUserInventory) {
    return await this.appService.addToUserInventory(createUserInventory);
  }

  @Post('/user/create')
  @HttpCode(200)
  async createUser(@Body() createUser: SilicUser) {
    return await this.appService.createUser(createUser);
  }

  @Post('/user/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { user_id: string; prompt: string }) {
    return await this.appService.generateImage(body.user_id, body.prompt);
  }

  @Post('/user/inventory/get')
  @HttpCode(200)
  async getInventoryImage(@Body() body: { image_id: string }) {
    return await this.appService.getInventoryImage(body.image_id);
  }
}

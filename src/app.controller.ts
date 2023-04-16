import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './app.service';

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

  // Get all Users from inventory
  @Get('/user/')
  @HttpCode(200)
  async getAllUser() {
    return await this.appService.getAllUsers();
  }

  // Get all imageIDs from inventory
  @Get('/inventory/')
  @HttpCode(200)
  async getAllUserInventory() {
    return await this.appService.getAllUserInventory();
  }

  // Get a User inventory (history)
  @Post('/inventory/get')
  @HttpCode(200)
  async getUserInventory(@Body() body: { user_id: string }) {
    return await this.appService.getUserInventory(body.user_id);
  }

  // Get a User
  @Post('/user/get')
  @HttpCode(200)
  async getUserData(@Body() body: { email: string }) {
    return await this.appService.getUser(body.email);
  }

  // Save Uploaded images to inventory
  @Post('/inventory/create')
  @HttpCode(200)
  async createUserInventory(
    @Body() createUserInventory: { email: string; image: Buffer },
  ) {
    return await this.appService.addImageToBucket(
      createUserInventory.email,
      createUserInventory.image,
    );
  }

  // Create a new User
  @Post('/user/create')
  @HttpCode(200)
  async createUser(@Body() body: { email: string }) {
    return await this.appService.createUser(body.email);
  }

  // Generate Image from AI model
  @Post('/user/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { email: string; prompt: string }) {
    return await this.appService.generateImage(body.email, body.prompt);
  }

  // Get an image from inventory
  @Post('/user/inventory/get')
  @HttpCode(200)
  async getInventoryImage(@Body() body: { image_id: string }) {
    return await this.appService.getInventoryImage(body.image_id);
  }
}

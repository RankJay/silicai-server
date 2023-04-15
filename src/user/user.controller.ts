import { Controller, Get, HttpCode, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { SilicUser } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @HttpCode(200)
  async getAllUser() {
    return await this.userService.getAllUsers();
  }

  @Post('/get')
  @HttpCode(200)
  async getUser(@Body() body: { email: string }) {
    return await this.userService.getUser(body.email);
  }

  @Post('/create')
  @HttpCode(200)
  async createUser(@Body() createUser: SilicUser) {
    return await this.userService.createUser(createUser);
  }

  @Post('/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { user_id: string; prompt: string }) {
    return await this.userService.generateImage(body.user_id, body.prompt);
  }

  @Post('/inventory/get')
  @HttpCode(200)
  async getInventoryImage(@Body() body: { image_id: string }) {
    return await this.userService.getInventoryImage(body.image_id);
  }
}

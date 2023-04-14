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
    return await this.userService.getUser({ email: body.email }, ['inventory']);
  }

  @Post('/create')
  @HttpCode(200)
  async createUser(@Body() createUser: SilicUser) {
    return await this.userService.createUser(createUser);
  }
}

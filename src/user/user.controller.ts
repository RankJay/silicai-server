import { Controller, Get, HttpCode, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { SilicUser } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @HttpCode(200)
  async getUser() {
    return await this.userService.getUser({ email: 'jay@mm' }, ['inventory']);
  }

  @Post('/create')
  @HttpCode(200)
  async createUser(@Body() createUser: SilicUser) {
    return await this.userService.createUser(createUser);
  }
}

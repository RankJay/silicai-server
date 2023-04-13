import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class AppController {
  check: boolean;
  constructor() {
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
}

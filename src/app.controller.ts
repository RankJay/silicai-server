import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  @Get("/health")
  async healthCheck() {
    console.log(`=> [AppController] API Event: 'HEALTH_CHECK'`);
    return {
      status: 200,
    };
  }
}

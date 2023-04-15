import { Controller, Get, HttpCode } from '@nestjs/common';
import { Leap } from '@leap-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Controller()
export class AppController {
  check: boolean;
  leapClient: Leap;
  supabaseClient: SupabaseClient;
  constructor(private readonly config: ConfigService) {
    this.leapClient = new Leap(this.config.get<string>('leap_client'));
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.leapClient.useModel(this.config.get<string>('model'));
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

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SilicUserInventory } from './inventory.dto';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class InventoryService {
  supabaseClient: SupabaseClient;
  constructor(
    @Inject(UserService) private userService: UserService,
    private readonly config: ConfigService,
  ) {
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
  }

  async getAllUserInventory() {
    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*');

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async getUserInventory(id: string) {
    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*')
      .eq('id', id);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async addToUserInventory(body: SilicUserInventory) {
    const exisitingSilicUser = await this.userService.getUser(body.user_id);

    if (exisitingSilicUser.length > 0) {
      const { data, error } = await this.supabaseClient
        .from('inventory')
        .insert({
          image_id: body.image_id,
          user_id: body.user_id,
        });

      if (error) {
        console.log('Error', error);
        throw new BadRequestException(error);
      }
      return data;
    } else {
      const { data, error } = await this.supabaseClient
        .from('inventory')
        .insert({
          image_id: body.image_id,
        });
      if (error) {
        console.log('Error', error);
        throw new BadRequestException(error);
      }
      return data;
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SilicUserInventory } from 'src/inventory/inventory.dto';
import { Leap } from '@leap-ai/sdk';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  supabaseClient: SupabaseClient;
  leapClient: Leap;
  constructor(private readonly config: ConfigService) {
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.leapClient = new Leap(this.config.get<string>('leap_client'));
    this.leapClient.useModel(this.config.get<string>('model'));
  }

  async getAllUsers() {
    const { data, error } = await this.supabaseClient.from('user').select('*');

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async getUser(id: string) {
    const { data, error } = await this.supabaseClient
      .from('user')
      .select('*')
      .eq('user_id', id);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async createUser(user: any) {
    const { data, error } = await this.supabaseClient.from('user').insert(user);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async generateImage(user_id: string, prompt: string) {
    const { data, error } = await this.leapClient.generate.generateImage({
      prompt: prompt,
      width: 1024,
      height: 1024,
    });
    if (error) {
      console.log(error);
      throw new BadRequestException(
        'Something went wrong while generating the image!',
      );
    }
    if (data) {
      const imageUrl = data.images[0].uri;
      const response: {
        data:
          | WithImplicitCoercion<string>
          | { [Symbol.toPrimitive](hint: 'string'): string };
      } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const imageData = Buffer.from(response.data, 'binary');
      this.addImageToBucket(user_id, imageData);
      const image = `data:image/png;base64,${imageData.toString('base64')}`;

      return image;
    }
  }

  async getInventoryImage(image_id: string) {
    const { data } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .download(`${this.config.get<string>('env')}/${image_id}.png`);
    return data;
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
    const exisitingSilicUser = await this.getUser(body.user_id);

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

  async addImageToBucket(user_id: string, image: Buffer) {
    const image_id = randomUUID();
    const { data, error } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .upload(`${this.config.get<string>('env')}/${image_id}.png`, image);
    if (error) {
      console.log('Error', error);
    }

    if (data.path) {
      this.addToUserInventory({
        user_id,
        image_id,
      });
    }
  }
}

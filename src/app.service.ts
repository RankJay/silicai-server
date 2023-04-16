import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Leap } from '@leap-ai/sdk';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  private supabaseClient: SupabaseClient;
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

  async getUser(email: string) {
    const { data, error } = await this.supabaseClient
      .from('user')
      .select('*')
      .eq('email', email);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }

    // if (data.length == 0) {
    //   const newUser = await this.createUser(email);
    //   return newUser;
    // }
    return data;
  }

  async createUser(email: string) {
    const { data, error } = await this.supabaseClient.from('user').insert({
      user_id: randomUUID(),
      email,
    });

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async generateImage(email: string, prompt: string) {
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
      this.addImageToBucket(email, imageData);
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

  async getUserInventory(user_id: string) {
    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async addToUserInventory(body: { email: string; image_id: string }) {
    const exisitingSilicUser = await this.getUser(body.email);

    if (exisitingSilicUser.length > 0) {
      const { data, error } = await this.supabaseClient
        .from('inventory')
        .insert({
          image_id: body.image_id,
          user_id: exisitingSilicUser['user_id'],
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
          user_id: `0000-0000-0000-0000-0000`,
        });
      if (error) {
        console.log('Error', error);
        throw new BadRequestException(error);
      }
      return data;
    }
  }

  async addImageToBucket(email: string, image: Buffer) {
    const image_id = randomUUID();
    const { data, error } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .upload(`${this.config.get<string>('env')}/${image_id}.png`, image);
    if (error) {
      console.log('Error', error);
    }

    if (data.path) {
      this.addToUserInventory({
        email,
        image_id,
      });
    }
  }
}

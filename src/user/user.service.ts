import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Leap } from '@leap-ai/sdk';
import axios from 'axios';

@Injectable()
export class UserService {
  leapClient: Leap;
  supabaseClient: SupabaseClient;
  constructor(private readonly config: ConfigService) {
    this.leapClient = new Leap(this.config.get<string>('leap_client'));
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
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
}

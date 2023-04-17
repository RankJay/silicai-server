import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Leap } from '@leap-ai/sdk';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class AppService {
  private supabaseClient: SupabaseClient;
  leapClient: Leap;
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.leapClient = new Leap(this.config.get<string>('leap_client'));
    this.leapClient.useModel(this.config.get<string>('model'));
  }

  async convertImageURLtoImage(email: string, url: string) {
    const response: {
      data:
        | WithImplicitCoercion<string>
        | { [Symbol.toPrimitive](hint: 'string'): string };
    } = await axios.get(url, { responseType: 'arraybuffer' });

    const imageData = Buffer.from(response.data, 'binary');
    this.addImageToBucket(email, imageData);
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
    const { data } = await firstValueFrom(
      this.httpService
        .post('https://stablediffusionapi.com/api/v3/dreambooth', {
          key: 'lxqfWba1otjYgl8kZGmljd6SvzEoPRZCPV7mWWMs5HxoVL5EFlpcMK40IZKI',
          model_id: 'midjourney',
          prompt,
          width: '1024',
          height: '1024',
          samples: '1',
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );
    // if (error) {
    //   console.log(error);
    //   throw new BadRequestException(
    //     'Something went wrong while generating the image!',
    //   );
    // }
    if (data.output[0]) {
      this.convertImageURLtoImage(email, data.output[0]);
      return data.output[0];
    }
  }

  async getInventoryImage(image_id: string) {
    const { data } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .download(`${this.config.get<string>('env')}/${image_id}.png`);

    const buffer = Buffer.from(new Uint8Array(await data.arrayBuffer()));
    return buffer.toString('base64');
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
          user_id: '3246e542-01a2-4777-a9b9-3c0e09f05878',
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

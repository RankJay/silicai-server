import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Leap } from '@leap-ai/sdk';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import Stripe from 'stripe';

@Injectable()
export class AppService {
  private supabaseClient: SupabaseClient;
  leapClient: Leap;
  stripeClient: Stripe;
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.stripeClient = new Stripe(this.config.get<string>('stripe_client'), {
      apiVersion: '2022-11-15',
    });
    this.leapClient = new Leap(this.config.get<string>('leap_client'));
    this.leapClient.useModel(this.config.get<string>('model'));
  }

  async stripeSession(data: {
    origin: string;
    image: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
  }) {
    const transformedItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          images: [data.image],
          name: data.name,
          description: data.description,
        },
        unit_amount: data.price * 100,
      },
      quantity: data.quantity,
    };

    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [transformedItem],
      mode: 'payment',
      success_url: data.origin + '/new?status=success',
      cancel_url: data.origin + '/new?status=cancel',
      metadata: {
        images: data.image,
      },
    });

    return session;
  }

  async convertImageURLtoImage(body: {
    clerk_id: string;
    url: string;
    prompt: string;
  }) {
    const response: {
      data:
        | WithImplicitCoercion<string>
        | { [Symbol.toPrimitive](hint: 'string'): string };
    } = await axios.get(body.url, { responseType: 'arraybuffer' });

    const imageData = Buffer.from(response.data, 'binary');
    this.addImageToBucket({
      clerk_id: body.clerk_id,
      image: imageData,
      prompt: body.prompt,
    });
  }

  async getAllUsers() {
    const { data, error } = await this.supabaseClient.from('user').select('*');

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async getUserById(clerk_id: string) {
    const { data, error } = await this.supabaseClient
      .from('user')
      .select('*')
      .eq('clerk_id', clerk_id);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }

    // if (data.length == 0) {
    //   const newUser = await this.createUser(clerk_id);
    //   return newUser;
    // }
    return data;
  }

  async createUser(email: string, clerk_id: string) {
    const { data, error } = await this.supabaseClient.from('user').insert({
      user_id: randomUUID(),
      email,
      clerk_id,
    });

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async generateImageFromSD(body: { clerk_id: string; prompt: string }) {
    const { data, status } = await this.httpService.axiosRef.post(
      'https://stablediffusionapi.com/api/v3/dreambooth',
      {
        key: 'lxqfWba1otjYgl8kZGmljd6SvzEoPRZCPV7mWWMs5HxoVL5EFlpcMK40IZKI',
        model_id: 'midjourney',
        prompt: body.prompt,
        width: '1024',
        height: '1024',
        samples: '1',
      },
    );
    // if (error) {
    //   console.log(error);
    //   throw new BadRequestException(
    //     'Something went wrong while generating the image!',
    //   );
    // }
    console.log(
      `[${new Date().toISOString()}] => clerk_id: ${
        body.clerk_id
      } responded with status ${status}\n ==> ${data.output}`,
    );
    if (data.output[0]) {
      this.convertImageURLtoImage({
        clerk_id: body.clerk_id,
        url: data.output[0],
        prompt: body.prompt,
      });
      return data.output[0];
    }
  }

  async getInventoryImage(image_id: string) {
    const { data } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .download(`${this.config.get<string>('databaseenv')}/${image_id}.png`);

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

  async getUserInventory(clerk_id: string) {
    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*')
      .eq('clerk_id', clerk_id);

    if (error) {
      console.log('Error', error);
      throw new BadRequestException(error);
    }
    return data;
  }

  async addToUserInventory(body: {
    clerk_id: string;
    image_id: string;
    prompt: string;
  }) {
    const exisitingSilicUser = await this.getUserById(body.clerk_id);

    if (exisitingSilicUser.length > 0) {
      const { data, error } = await this.supabaseClient
        .from('inventory')
        .insert({
          image_id: body.image_id,
          clerk_id: await exisitingSilicUser[0].clerk_id,
          prompt: body.prompt,
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
          clerk_id: '0000',
        });
      if (error) {
        console.log('Error', error);
        throw new BadRequestException(error);
      }
      return data;
    }
  }

  async addImageToBucket(body: {
    clerk_id: string;
    image: Buffer;
    prompt: string;
  }) {
    const image_id = randomUUID();
    const { data, error } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .upload(
        `${this.config.get<string>('databaseenv')}/${image_id}.png`,
        body.image,
      );
    if (error) {
      console.log('Error', error);
    }

    if (data.path) {
      this.addToUserInventory({
        clerk_id: body.clerk_id,
        image_id,
        prompt: body.prompt,
      });
    }
  }
}

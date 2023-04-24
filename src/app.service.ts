import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import Stripe from 'stripe';
import Replicate from 'replicate';
import { FetchService } from 'nestjs-fetch';

@Injectable()
export class AppService {
  private supabaseClient: SupabaseClient;
  stripeClient: Stripe;
  replicateClient: Replicate;
  replicateModel: `${string}/${string}:${string}`;
  dailyLimitUsers: { [clerk_id: string]: number } = {};
  dailyLimitThreshold: number;
  verifiedUsers: { [clerk_id: string]: number } = {};
  fakeUsers: { [clerk_id: string]: number } = {};
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly fetch: FetchService,
  ) {
    this.replicateClient = new Replicate({
      auth: '73b7775ce0cb8b967ce985eca2798e7d5a77c2b0',
    });
    this.replicateModel =
      'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf';
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.stripeClient = new Stripe(this.config.get<string>('stripe_client'), {
      apiVersion: '2022-11-15',
    });
    this.dailyLimitThreshold = this.config.get<number>('daily_limit');
  }

  // Rate limiting Gaurd
  async checkLastImageGenerated(clerk_id: string): Promise<boolean> {
    if (this.fakeUsers[clerk_id]) {
      console.log(
        `[${new Date().toISOString()}] => 'FAKE' USER with clerk_id: ${clerk_id}`,
      );

      throw new BadRequestException(
        'We have greylisted you. Reach out to us in order to get whitelisted.',
      );
      return false;
    }
    if (this.verifiedUsers[clerk_id]) {
      if (new Date().getTime() - this.verifiedUsers[clerk_id] > 6000) {
        if (this.dailyLimitUsers[clerk_id] <= this.dailyLimitThreshold) {
          this.verifiedUsers[clerk_id] = new Date().getTime();
          this.dailyLimitUsers[clerk_id] += 1;
          return true;
        }
        console.log(
          `[${new Date().toISOString()}] => 'DAILY_LIMIT' USER with clerk_id: ${clerk_id}`,
        );
        throw new BadRequestException('Daily Limit Reached.');
        return false;
      }
      console.log(
        `[${new Date().toISOString()}] => 'RATE_LIMIT' USER with clerk_id: ${clerk_id}`,
      );
      throw new BadRequestException('Rate Limit. Try again after sometime!');
      return false;
    }
    const userExists = await this.getUserById(clerk_id);

    if (userExists.length > 0) {
      this.verifiedUsers[clerk_id] = new Date().getTime();
      this.dailyLimitUsers[clerk_id] = 1;
      return true;
    }
    console.log(
      `[${new Date().toISOString()}] => 'NEW_FAKE' USER with clerk_id: ${clerk_id}`,
    );
    this.fakeUsers[clerk_id] = new Date().getTime();
    throw new BadRequestException(
      'We have greylisted you. Reach out to us in order to get whitelisted.',
    );
    return false;
  }

  // Create a new Stripe Session
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

  async generateImageFromReplicate(body: { clerk_id: string; prompt: string }) {
    const output: any = await this.replicateClient.run(this.replicateModel, {
      input: {
        prompt: body.prompt,
      },
    });

    console.log(
      `[${new Date().toISOString()}] => clerk_id: ${
        body.clerk_id
      } responded.\n ==> ${await output[0]}`,
    );
    if (await output[0]) {
      this.convertImageURLtoImage({
        clerk_id: body.clerk_id,
        url: await output[0],
        prompt: body.prompt,
      });
    }
    return { image: await output[0] };
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

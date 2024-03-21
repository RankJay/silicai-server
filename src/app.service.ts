import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import Stripe from 'stripe';
import Replicate from 'replicate';
import { FetchService } from 'nestjs-fetch';
import { Cron, CronExpression } from '@nestjs/schedule';

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
      auth: this.config.get<string>('replicate_client'),
    });
    this.replicateModel =
      this.config.get<`${string}/${string}:${string}`>('replicate_model');
    this.supabaseClient = createClient(
      this.config.get<string>('supbase_url'),
      this.config.get<string>('supabase_key'),
    );
    this.stripeClient = new Stripe(this.config.get<string>('stripe_client'), {
      apiVersion: '2022-11-15',
    });
    this.dailyLimitThreshold = this.config.get<number>('daily_limit');
  }

  // Cron Job to reset daily limit of users.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runCronJob() {
    this.dailyLimitUsers = {};
    this.verifiedUsers = {};
    this.fakeUsers = {};
    console.log(
      `[${new Date().toISOString()}] => 'DAILY LIMIT RESET' Cron Job.`,
    );
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

  // Create a new Stripe SetupIntent
  async stripeSetupIntent() {
    const setupIntent = await this.stripeClient.setupIntents.create({
      payment_method_types: ['card'],
    });

    return setupIntent;
  }

  // Create a new Stripe Session
  async stripeSession(data: {
    origin: string;
    image: string;
    imageId: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
    metadata: { size: string; style: string };
    referral: string;
  }) {
    console.log(data);
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
      payment_intent_data: {
        metadata: {
          images: data.image,
          imageID: data.imageId,
          size: data.metadata.size,
          style: data.metadata.style,
        },
      },
      client_reference_id: data.referral,
      customer_creation: 'always',
      phone_number_collection: {
        enabled: true,
      },
      // allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: [
          'US',
          'GB',
          'IN',
          'CA',
          'DE',
          'FR',
          'AU',
          'JP',
          'AE',
          'PL',
          'SE',
          'CH',
          'ES',
          'IT',
          'IE',
          'BR',
          'PT',
          'MX',
          'HK',
          'NO',
          'FI',
          'SE',
          'SG',
          'ID',
          'NZ',
          'BE',
          'GR',
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 4 * 100,
              currency: 'usd',
            },
            display_name: 'Free Shipping (in US)',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 7,
              },
              maximum: {
                unit: 'business_day',
                value: 15,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: this.config.get<number>('shipping_fee') * 100,
              currency: 'usd',
            },
            display_name: 'International Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 7,
              },
              maximum: {
                unit: 'business_day',
                value: 15,
              },
            },
          },
        },
      ],
      line_items: [transformedItem],
      mode: 'payment',
      success_url: data.origin + '/new?status=success',
      cancel_url: data.origin + '/new?status=cancel',
      metadata: {
        images: data.image,
        size: data.metadata.size,
        style: data.metadata.style,
      },
    });

    return session;
  }

  async sendWelcomEmail(data: Record<string, any>) {
    this.httpService.axiosRef
      .post(
        `https://api.sendinblue.com/v3/smtp/email`,
        {
          to: [
            {
              email: data.email_addresses[0].email_address,
              name: data.username,
            },
          ],
          templateId: 1,
          // params: {
          //   name: 'Aamir',
          //   surname: 'Patel',
          // },
          headers: {
            'X-Mailin-custom':
              'custom_header_1:custom_value_1|custom_header_2:custom_value_2|custom_header_3:custom_value_3',
            charset: 'iso-8859-1',
          },
        },
        {
          headers: {
            'api-key': this.config.get<string>('sendinblue_client'),
          },
        },
      )
      .then((res) => {
        console.log(
          `[${new Date().toISOString()}] ==> Welcome Email Sent: ${
            data.email_addresses[0].email_address
          }`,
        );
      })
      .catch((err) => {
        console.log(
          `[${new Date().toISOString()}] ==> Error Event: ${
            data.email_addresses[0].email_address
          }\n${err}`,
        );
      });
    return;
  }

  async sendConfirmationEmail(data: Record<string, any>) {
    this.httpService.axiosRef
      .post(
        `https://api.sendinblue.com/v3/smtp/email`,
        {
          to: [
            {
              email: data.email,
              name: data.username,
            },
          ],
          templateId: 2,
          // params: {
          //   name: 'Aamir',
          //   surname: 'Patel',
          // },
          headers: {
            'X-Mailin-custom':
              'custom_header_1:custom_value_1|custom_header_2:custom_value_2|custom_header_3:custom_value_3',
            charset: 'iso-8859-1',
          },
        },
        {
          headers: {
            'api-key': this.config.get<string>('sendinblue_client'),
          },
        },
      )
      .then((res) => {
        console.log(
          `[${new Date().toISOString()}] ==> Successfull Order Email Sent: ${
            data.email
          }`,
        );
      })
      .catch((err) => {
        console.log(
          `[${new Date().toISOString()}] ==> Error Event: ${
            data.email
          }\n${err}`,
        );
      });
    return;
  }

  async sendErrorEmail(data: Record<string, any>) {
    this.httpService.axiosRef
      .post(
        `https://api.brevo.com/v3/smtp/email`,
        {
          sender: {
            email: 'info@silc.ai',
            name: 'Silic AI',
          },
          to: [
            {
              email: data.email,
              name: data.username,
            },
          ],
          subject: 'Error Notification!',
          htmlContent: `<html><head></head><body><p>Alert Notification!</p><p>Prompt: ${data.prompt}</p><p>UserID: ${data.userId}</p><p>Error: ${data.error}</p></body></html>`,
          headers: {
            'X-Mailin-custom':
              'custom_header_1:custom_value_1|custom_header_2:custom_value_2|custom_header_3:custom_value_3',
            charset: 'iso-8859-1',
          },
        },
        {
          headers: {
            'api-key': this.config.get<string>('sendinblue_client'),
          },
        },
      )
      .then((res) => {
        console.log(
          `[${new Date().toISOString()}] ==> Successfull Alert Email Sent: ${
            data.email
          }`,
        );
      })
      .catch((err) => {
        console.log(
          `[${new Date().toISOString()}] ==> Error Event: ${
            data.email
          }\n${err}`,
        );
      });
    return;
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
      replicate_url: body.url,
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

  async feelImage(body: {
    clerk_id: string;
    image_id: string;
    isLike: boolean;
  }) {
    const { data, error } = await this.supabaseClient.from('feel').insert({
      image_id: body.image_id,
      clerk_id: body.clerk_id,
      isLike: body.isLike,
    });

    if (error) {
      console.log('Error', error);
    }
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

  async getImageFromInventory(image_id: string) {
    const { data, error } = await this.supabaseClient
      .from('inventory')
      .select('*')
      .eq('image_id', image_id);

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

  async delay(time: number) {
    return await new Promise((resolve) => {
      const targetTime = Date.now() + time;
      const interval = setInterval(() => {
        if (Date.now() >= targetTime) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  }

  async generateImageFromWombo(body: { clerk_id: string; prompt: string }) {
    try {
      console.log(
        `[${new Date().toISOString()}] => clerk_id: ${
          body.clerk_id
        } Creating WOMBO Task`,
      );
      const response1 = await this.httpService.axiosRef.post(
        'https://api.luan.tools/api/tasks/',
        {
          use_target_image: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('wombo_api_key')}`,
          },
        },
      );
      if (response1.status === 200) {
        console.log(
          `[${new Date().toISOString()}] => clerk_id: ${
            body.clerk_id
          } Putting Prompt in WOMBO Task`,
        );
        const response2 = await this.httpService.axiosRef.put(
          `https://api.luan.tools/api/tasks/${await response1.data.id}`,
          {
            input_spec: {
              prompt: body.prompt,
              style: 84,
              height: 1024,
              width: 1024,
              target_image_weight: 0.1,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.get<string>(
                'wombo_api_key',
              )}`,
            },
          },
        );
        if (response2.status === 200) {
          // Wait for 6 seconds before fetch request
          await this.delay(10000);
          console.log(
            `[${new Date().toISOString()}] => clerk_id: ${
              body.clerk_id
            } Getting WOMBO Task`,
          );

          const response3 = await this.httpService.axiosRef.get(
            `https://api.luan.tools/api/tasks/${await response1.data.id}`,
            {
              headers: {
                Authorization: `Bearer ${this.config.get<string>(
                  'wombo_api_key',
                )}`,
              },
            },
          );

          console.log(
            `[${new Date().toISOString()}] => clerk_id: ${
              body.clerk_id
            } responded.\n ==> ${await response3.data.result}`,
          );

          return response3.data.result;
        }
      }
    } catch (err) {
      console.log('Error', err);
      throw new BadRequestException(
        'Hello. We had an issue processing your design. Our system may be at capacity or there is an issue with your prompt that has caused image generation to fail. Please try again or come back to silic.ai at a later time. We apologize for any inconvenience.',
      );
    }
  }

  async generateImageFromReplicate(body: { clerk_id: string; prompt: string }) {
    let output: any;

    await this.replicateClient
      .run(this.replicateModel, {
        input: {
          prompt: body.prompt,
        },
      })
      .then((resp) => {
        output = resp;
      })
      .catch((err) => {
        console.log(
          `[${new Date().toISOString()}] ==> Error Event: ${
            body.clerk_id
          }\n${err}`,
        );
        this.sendErrorEmail({
          email: 'rank01jay01@gmail.com',
          username: 'jayrank',
          prompt: body.prompt,
          userId: body.clerk_id,
          error: err,
        });
        this.sendErrorEmail({
          email: 'aampatel12@gmail.com',
          username: 'aamirpatel',
          prompt: body.prompt,
          userId: body.clerk_id,
          error: err,
        });
        throw new BadRequestException(
          'Hello. We had an issue processing your design. Our system may be at capacity or there is an issue with your prompt that has caused image generation to fail. Please try again or come back to silic.ai at a later time. We apologize for any inconvenience.',
        );
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
    return await output[0];
  }

  async generateImageFromOpenAI(body: { clerk_id: string; prompt: string }) {
    let output: any;

    await this.httpService.axiosRef.post(
      'https://api.openai.com/v1/images/generations',
      {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024"
      },
      {
        headers: {
          "Authorization": `Bearer ${this.config.get<string>('openai_api_key')}`
        }
      }
    ).then((resp) => {
        output = resp;
      })
      .catch((err) => {
        console.log(
          `[${new Date().toISOString()}] ==> Error Event: ${
            body.clerk_id
          }\n${err}`,
        );
        this.sendErrorEmail({
          email: 'rank01jay01@gmail.com',
          username: 'jayrank',
          prompt: body.prompt,
          userId: body.clerk_id,
          error: err,
        });
        this.sendErrorEmail({
          email: 'aampatel12@gmail.com',
          username: 'aamirpatel',
          prompt: body.prompt,
          userId: body.clerk_id,
          error: err,
        });
        throw new BadRequestException(
          'Hello. We had an issue processing your design. Our system may be at capacity or there is an issue with your prompt that has caused image generation to fail. Please try again or come back to silic.ai at a later time. We apologize for any inconvenience.',
        );
      });

    console.log(
      `[${new Date().toISOString()}] => clerk_id: ${
        body.clerk_id
      } responded.\n ==> ${await output.data[0]}`,
    );
    if (await output.data[0]) {
      this.convertImageURLtoImage({
        clerk_id: body.clerk_id,
        url: await output.data[0].url,
        prompt: body.prompt,
      });
    }
    return await output[0];
  }

  async getInventoryImage(image_id: string) {
    const { data, error } = await this.supabaseClient.storage
      .from('silicai-bucket')
      .download(`${this.config.get<string>('databaseenv')}/${image_id}.png`);

    if (error) {
      return null;
    }

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
    replicate_url: string;
    prompt: string;
  }) {
    const exisitingSilicUser = await this.getUserById(body.clerk_id);

    if (exisitingSilicUser.length > 0) {
      const { data, error } = await this.supabaseClient
        .from('inventory')
        .insert({
          image_id: body.image_id,
          clerk_id: await exisitingSilicUser[0].clerk_id,
          replicate_url: body.replicate_url,
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
          replicate_url: body.replicate_url,
          prompt: body.prompt,
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
    replicate_url: string;
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
        replicate_url: body.replicate_url,
        prompt: body.prompt,
      });
    }
  }
}

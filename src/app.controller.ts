import {
  Body,
  Controller,
  Get,
  HttpCode,
  Options,
  Post,
  Request,
  Response,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  check: boolean;
  constructor(private readonly appService: AppService) {
    this.check = true;
  }

  @Options('*')
  options(@Response() res: any) {
    console.log('Preflight Request', res);
    return;
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

  // Get all Users from inventory
  @Get('/user/')
  @HttpCode(200)
  async getAllUser() {
    return await this.appService.getAllUsers();
  }

  // Get all imageIDs from inventory
  @Get('/inventory/')
  @HttpCode(200)
  async getAllUserInventory() {
    return await this.appService.getAllUserInventory();
  }

  // Clerk Webhook to receive events
  @Post('/clerk/webhook')
  @HttpCode(200)
  async clerkWebhook(
    @Body()
    body: {
      data: Record<any, any>;
      object: string;
      event: string;
    },
  ) {
    console.log(body.data);
    console.log(
      `[${new Date().toISOString()}] ==> UserCreate Event: ${
        body.data.email_addresses[0].email_address
      }`,
    );

    this.appService.sendWelcomEmail(body.data);
    this.appService.createUser(
      body.data.email_addresses[0].email_address,
      body.data.id,
    );
    return;
  }

  // Clerk Webhook to receive events
  @Post('/stripe/webhook')
  @HttpCode(200)
  async stripeWebhook(
    @Body()
    body: Record<any, any>,
  ) {
    console.log(body);
    console.log(
      `[${new Date().toISOString()}] ==> Stripe Event: ${body.object.status}`,
    );

    if (body.object.status === 'succeeded' && body.object.receipt_email) {
      this.appService.sendConfirmationEmail({
        email: body.object.receipt_email,
        username: body.object.shipping.name,
      });
    }
    return;
  }

  // Stripe Session
  @Post('/stripe/session')
  @HttpCode(200)
  async stripeSession(
    @Body()
    body: {
      image: string;
      imageId: string;
      name: string;
      description: string;
      quantity: number;
      price: number;
      metadata: {
        size: string;
        style: string;
      };
      referral: string;
    },
    @Request() req: any,
  ) {
    console.log(
      `[${new Date().toISOString()}] ==> Attempt to Stripe Checkout from: ${
        req.headers.origin
      }`,
    );
    const session = await this.appService.stripeSession({
      origin: 'https://silic.ai',
      ...body,
    });

    return session;
  }

  // Stripe SetupIntent
  @Post('/stripe/intent')
  @HttpCode(200)
  async stripeSetupIntent(
    @Body()
    body: {
      image: string;
      imageId: string;
      name: string;
      description: string;
      quantity: number;
      price: number;
      metadata: {
        size: string;
        style: string;
      };
      referral: string;
    },
    @Request() req: any,
  ) {
    console.log(
      `[${new Date().toISOString()}] ==> Attempt to Stripe SetupIntent from: ${
        req.headers.origin
      }`,
    );
    const session = await this.appService.stripeSetupIntent();

    return session;
  }

  // Get an image from inventory (history)
  @Post('/inventory/image')
  @HttpCode(200)
  async getImageFromInventory(@Body() body: { image_id: string }) {
    return await this.appService.getImageFromInventory(body.image_id);
  }

  // Get a User inventory (history)
  @Post('/inventory/get')
  @HttpCode(200)
  async getUserInventory(@Body() body: { clerk_id: string }) {
    return await this.appService.getUserInventory(body.clerk_id);
  }

  // Get a User
  @Post('/user/get')
  @HttpCode(200)
  async getUserDataById(@Body() body: { clerk_id: string }) {
    return await this.appService.getUserById(body.clerk_id);
  }

  // Save Uploaded images to inventory
  @Post('/inventory/create')
  @HttpCode(200)
  async createUserInventory(
    @Body()
    createUserInventory: {
      clerk_id: string;
      image: Buffer;
      url: string;
      prompt: string;
    },
  ) {
    return await this.appService.addImageToBucket({
      clerk_id: createUserInventory.clerk_id,
      image: createUserInventory.image,
      replicate_url: createUserInventory.url,
      prompt: createUserInventory.prompt,
    });
  }

  // Create a new User
  @Post('/user/create')
  @HttpCode(200)
  async createUser(@Body() body: { email: string; clerk_id: string }) {
    return await this.appService.createUser(body.email, body.clerk_id);
  }

  // Generate Image from AI model
  @Post('/user/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { clerk_id: string; prompt: string }) {
    if (await this.appService.checkLastImageGenerated(body.clerk_id)) {
      const image = await this.appService.generateImageFromReplicate({
        clerk_id: body.clerk_id,
        prompt: body.prompt,
      });
      return {
        image,
      };
    }

    return {
      error: 'rate limited',
    };
  }

  // Generate Image from AI model
  @Post('/user/save')
  @HttpCode(200)
  async saveImage(
    @Body() body: { clerk_id: string; url: string; prompt: string },
  ) {
    console.log(
      `[${new Date().toISOString()}] => clerk_id: ${
        body.clerk_id
      }\n ==> Saving Image: ${body.url}`,
    );
    this.appService.convertImageURLtoImage({
      clerk_id: body.clerk_id,
      url: body.url,
      prompt: body.prompt,
    });
    return;
  }

  // Generate Image from AI model
  @Post('/user/feel')
  @HttpCode(200)
  async feelImage(
    @Body() body: { clerk_id: string; image_id: string; isLike: boolean },
  ) {
    console.log(
      `[${new Date().toISOString()}] => clerk_id: ${
        body.clerk_id
      }\n ==> Recording Like/Dislike: ${body.clerk_id}`,
    );
    this.appService.feelImage({
      clerk_id: body.clerk_id,
      image_id: body.image_id,
      isLike: body.isLike,
    });
    return;
  }

  // Get an image from inventory
  @Post('/user/inventory/get')
  @HttpCode(200)
  async getInventoryImage(@Body() body: { image_id: string }) {
    return { image: await this.appService.getInventoryImage(body.image_id) };
  }
}

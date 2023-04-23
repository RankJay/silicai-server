import {
  Body,
  Controller,
  Get,
  HttpCode,
  Options,
  Post,
  Response,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  check: boolean;
  constructor(private readonly appService: AppService) {
    this.check = true;
  }

  @Options('*')
  options(@Response() res: any) {
    console.log('Preflight Request');
    // let resp: ExpressResponse;
    // resp.set({
    //   'Access-Control-Allow-Methods': 'HEAD, GET, POST, PUT, PATCH, DELETE',
    //   'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    //   'Access-Control-Allow-Origin': '*',
    // });

    // res = resp;
    // return res;
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

  // Get a User inventory (history)
  @Post('/inventory/get')
  @HttpCode(200)
  async getUserInventory(@Body() body: { user_id: string }) {
    return await this.appService.getUserInventory(body.user_id);
  }

  // Get a User
  @Post('/user/get')
  @HttpCode(200)
  async getUserData(@Body() body: { email: string }) {
    return await this.appService.getUser(body.email);
  }

  // Save Uploaded images to inventory
  @Post('/inventory/create')
  @HttpCode(200)
  async createUserInventory(
    @Body()
    createUserInventory: {
      email: string;
      image: Buffer;
      prompt: string;
    },
  ) {
    return await this.appService.addImageToBucket({
      email: createUserInventory.email,
      image: createUserInventory.image,
      prompt: createUserInventory.prompt,
    });
  }

  // Create a new User
  @Post('/user/create')
  @HttpCode(200)
  async createUser(@Body() body: { email: string }) {
    return await this.appService.createUser(body.email);
  }

  // Generate Image from AI model
  @Post('/user/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { email: string; prompt: string }) {
    const image = await this.appService.generateImageFromReplicate({
      email: body.email,
      prompt: body.prompt,
    });
    return {
      image,
    };
  }

  // Generate Image from AI model
  @Post('/user/save')
  @HttpCode(200)
  async saveImage(
    @Body() body: { email: string; url: string; prompt: string },
  ) {
    console.log(
      `[${new Date().toISOString()}] => email: ${
        body.email
      }\n ==> Saving Image: ${body.url}`,
    );
    this.appService.convertImageURLtoImage({
      email: body.email,
      url: body.url,
      prompt: body.prompt,
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

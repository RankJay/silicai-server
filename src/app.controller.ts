import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Leap } from '@leap-ai/sdk';
import axios from 'axios';
import { InventoryService } from './inventory/inventory.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  check: boolean;
  leap: Leap;
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly config: ConfigService,
  ) {
    this.leap = new Leap(this.config.get<string>('leap'));
    this.leap.useModel(this.config.get<string>('model'));
    this.check = true;
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

  @Post('/generate')
  @HttpCode(200)
  async generateImage(@Body() body: { email: string; prompt: string }) {
    const { data, error } = await this.leap.generate.generateImage({
      prompt: body.prompt,
      width: 1024,
      height: 1024,
    });
    if (error) {
      console.log(error);
      throw new Error('Something went wrong while generating the image!');
    }
    if (data) {
      const imageUrl = data.images[0].uri;
      console.log(imageUrl);
      const response: {
        data:
          | WithImplicitCoercion<string>
          | { [Symbol.toPrimitive](hint: 'string'): string };
      } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const imageData = Buffer.from(response.data, 'binary');
      const image = `data:image/png;base64,${imageData.toString('base64')}`;

      this.inventoryService.addToUserInventory({
        author: body.email,
        image,
      });

      return { image };
    }
  }
}

import { Controller, Get, Post } from "@nestjs/common";
import { Body, HttpCode, Query } from "@nestjs/common/decorators";
import {
  validatePromptMessage,
  getChallengeResponse,
} from "src/common/validators/validators";
import { BotService } from "./bot.service";

@Controller("bot")
export class BotController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private readonly botService: BotService) {}

  @Get("/subscribe")
  async waitlistEmail(@Query() query: Record<string, any>) {
    console.log(
      `=> [BotController] API Event: 'SUBSCRIBE' :: Request for signing up`
    );
    this.botService.sendMongoDB(query.email);
    return {
      status: 200,
    };
  }

  @Post("/test")
  async test(@Body() requestBody: Record<string, any>) {
    console.log(
      `=> [BotController] API Event: 'TEST' :: Request for testing OpenAI API`
    );
    this.botService.openAIchatGPTPrompt(requestBody.prompt);
    return {
      status: 200,
    };
  }

  @Get("/he")
  async get() {
    console.log(
      `=> [BotController] API Event: 'TEST' :: Request for testing OpenAI API`
    );
    const dbdata = await this.botService.getMongoDBData();
    const data = await dbdata.toArray();

    let ss = "";
    data.forEach(doc => {
      ss += doc.email + ",";
    });
    return {
      status: 200,
      ss: ss,
    };
  }

  @Post("/oauth")
  async oauth(@Body() requestBody: Record<string, any>) {
    console.log(
      `=> [BotController] API Event: 'OAUTH' :: Request to add webhook`
    );
    const OAuthObject = await this.botService.twitterOAuthGeneration();

    //ACCESS_TOKEN=1626464566996791296-VImXFhRSg0EHSg2VgtuEe87TEdaUm9
    //ACCESS_TOKEN_SECRET=vsYjERf4zoD5WiLiTHq8cYNte3Ew6rMZPgH6KyK2xy841

    OAuthObject.post(
      `https://api.twitter.com/1.1/account_activity/all/prod/webhooks.json`,
      process.env.TWITTER_ACCESS_TOKEN,
      process.env.TWITTER_ACCESS_TOKEN_SECRET,
      {
        url: requestBody.url,
      },
      "application/x-www-form-urlencoded",
      (e, data) => {
        console.error(e);
        console.log(data);
      }
    );

    return {
      status: 200,
    };
  }

  @Get("/callback")
  async authorizeOAuth(@Query() query: { state: string; code: string }) {
    console.log(
      `=> [BotController] API Event: 'OAUTH' :: Request for Twitter Verification with code: ${query.code}`
    );

    return await this.botService.twitterOAuthVerification(query.code);
  }

  @Get("/webhook")
  async crcCheck(@Query() query: { crc_token: string }) {
    console.log(
      `=> [BotController] API Event: 'OAUTH' :: Request for Twitter CRC Check with code: ${query.crc_token}`
    );

    return {
      response_token: "sha256=" + getChallengeResponse(query.crc_token),
    };
  }

  @Post("/webhook")
  @HttpCode(200)
  async twitterEventWebhook(@Body() event: Record<any, any>) {
    console.log(
      `=> [BotController] API Event: 'WEBHOOK EVENT'} ${event.for_user_id}`
    );
    // https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/account-activity-data-objects
    // let userTwitterId = "";
    // const creatorTwitterId = event.for_user_id;

    if (event["favorite_events"]) {
      console.log(`=> [BotController] API Event: 'FAVORITE EVENT'`);
      // Check if the event is a like event
      // https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/account-activity-data-objects#favorite_events
      // userTwitterId = event.favorite_events[0].user.id_str;
    } else if (event["follow_events"]) {
      console.log(`=> [BotController] API Event: 'FOLLOW EVENT'`);
      // Check if the event is a follow/unfollow event
      // https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/account-activity-data-objects#follow_events
      if (event.follow_events[0].type === "follow") {
        // Check if the event is a follow event
        // userTwitterId = event.follow_events[0].source.id;
      }
    } else if (event["tweet_create_events"]) {
      console.log(`=> [BotController] API Event: 'TWEET EVENT'`);
      // Check if the event is a tweet create
      // https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/account-activity-data-objects#tweet_create_events
      if (
        event.tweet_create_events[0].user.id_str !==
        (process.env.TWITTER_BOT_USER_ID as string)
      ) {
        if (event.tweet_create_events[0].retweeted_status) {
          console.log(`=> [BotController] API Event: 'RETWEET EVENT'`);
          // Retweeted tweet
        } else if (event.tweet_create_events[0].is_quote_status) {
          console.log(`=> [BotController] API Event: 'QUOTE TWEET EVENT'`);
          // Quoted tweet
        } else if (event.tweet_create_events[0].in_reply_to_status_id_str) {
          console.log(`=> [BotController] API Event: 'REPLY EVENT'`);
          // Reply tweet
          const response = await this.botService.openAIchatGPTPrompt(
            event.tweet_create_events[0].text
          );
          this.botService.twitterCreateReply(
            validatePromptMessage(response),
            event.tweet_create_events[0].id_str
          );
        } else if (
          event.tweet_create_events[0].entities.user_mentions[0].id_str ===
          (process.env.TWITTER_BOT_USER_ID as string)
        ) {
          console.log(`=> [BotController] API Event: 'MENTION TWEET EVENT'`);
          // Mention tweet
          const response = await this.botService.openAIchatGPTPrompt(
            event.tweet_create_events[0].text
          );
          this.botService.twitterCreateReply(
            validatePromptMessage(response),
            event.tweet_create_events[0].id_str
          );
        } else {
          // Any tweet
        }
        // userTwitterId = event.tweet_create_events[0].user.id_str;
      }
    } else if (
      event["direct_message_events"] &&
      event.direct_message_events[0].message_create.sender_id !==
        process.env.TWITTER_BOT_USER_ID
    ) {
      console.log(`=> [BotController] API Event: 'DM EVENT'`);
      const response = await this.botService.openAIchatGPTPrompt(
        event.direct_message_events[0].message_create.message_data.text
      );
      this.botService.twitterCreateDM(
        validatePromptMessage(response),
        event.direct_message_events[0].message_create.sender_id
      );
    }
  }
}

import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Configuration, OpenAIApi } from "openai";
import { MongoClient, ServerApiVersion } from "mongodb";
import { stringify } from "qs";
import { OAuth } from "oauth";
import axios from "axios";
import { validateBasicAuthenticaation } from "src/common/validators/validators";

@Injectable()
export class BotService {
  openaiClient: OpenAIApi;
  accessToken: string;
  refreshToken: string;
  mongoClient: MongoClient;

  constructor() {
    this.openaiClient = new OpenAIApi(
      new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      })
    );
    this.mongoClient = new MongoClient(
      "mongodb+srv://abstractadmin:kyliejenneronmongodb@abstractcluster.md4dh.mongodb.net/?retryWrites=true&w=majority",
      {
        serverApi: ServerApiVersion.v1,
      }
    );
  }

  @Cron("0 0 */2 * * *")
  async handleCron() {
    try {
      console.log(`=> [BotService] Cron Service: Refreshing Access Token`);
      await this.twitterOAuthRefreshVerification(this.refreshToken);
      console.log(
        `=> [BotService] Cron Service: Refreshed Access Token ${this.accessToken}`
      );
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async sendMongoDB(email: string) {
    try {
      console.log(`=> [BotService] Event: Send ${email} to mongoDB`);

      const mongoClient = await this.mongoClient.connect();
      return await mongoClient
        .db(process.env.MONGO_DATABASE_NAME)
        .collection(process.env.MONGO_COLLECTION_NAME)
        .insertOne({
          email: email,
        });
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async getMongoDBData() {
    try {
      console.log(`=> [BotService] Event: Receive from mongoDB`);

      const mongoClient = await this.mongoClient.connect();
      return await mongoClient
        .db(process.env.MONGO_DATABASE_NAME)
        .collection(process.env.MONGO_COLLECTION_NAME)
        .find({});
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async openAIchatGPTPrompt(prompt: string) {
    try {
      console.log(`=> [BotService] Event: Building prompt from openAI API`);
      const completion = await this.openaiClient.createCompletion({
        prompt: prompt,
        model: "text-davinci-003",
        max_tokens: 50,
        temperature: 0.8,
        top_p: 1,
        n: 1,
        best_of: 1,
      });

      return completion.data.choices[0].text;
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async twitterOAuthGeneration() {
    return new OAuth(
      "https://twitter.com/oauth/request_token",
      "https://twitter.com/oauth/access_token",
      `${process.env.TWITTER_CONSUMER_KEY}`,
      `${process.env.TWITTER_CONSUMER_SECRET}`,
      "1.0A",
      "https://oauth.pstmn.io/v1/browser-callback",
      "HMAC-SHA1"
    );
  }

  async twitterOAuthRefreshVerification(code: string) {
    try {
      console.log(
        `=> [BotService] Event: Authenticating User Renewal for OAuth 2.0 Access Token`
      );
      const data = stringify({
        refresh_token: code,
        grant_type: "refresh_token",
      });

      const config = {
        method: "post",
        url: "https://api.twitter.com/2/oauth2/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${validateBasicAuthenticaation(
            `${process.env.OAUTH_2_CLIENT_ID}:${process.env.OAUTH_2_CLIENT_SECRET}`
          )}`,
        },
        data: data,
      };

      const response = await axios(config);

      console.log(
        `=> [BotService] Event: Renewed User Access Token for OAuth 2.0: ${await response
          .data.access_token}`
      );

      this.accessToken = await response.data.access_token;
      this.refreshToken = await response.data.refresh_token;
      return response.data;
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async twitterOAuthVerification(code: string) {
    try {
      console.log(
        `=> [BotService] Event: Authenticating User for OAuth 2.0 Access Token`
      );
      const data = stringify({
        code: code,
        grant_type: "authorization_code",
        client_id: process.env.OAUTH_2_CLIENT_ID,
        redirect_uri: process.env.CALLBACK_URL,
        code_verifier: "challenge",
      });

      const config = {
        method: "post",
        url: "https://api.twitter.com/2/oauth2/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${validateBasicAuthenticaation(
            `${process.env.OAUTH_2_CLIENT_ID}:${process.env.OAUTH_2_CLIENT_SECRET}`
          )}`,
        },
        data: data,
      };

      const response = await axios(config);

      console.log(
        `=> [BotService] Event: User Access Token for OAuth 2.0: ${await response
          .data.access_token}`
      );

      this.accessToken = await response.data.access_token;
      this.refreshToken = await response.data.refresh_token;
      return response.data;
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async twitterCreateTweet(message: string) {
    try {
      console.log(
        `=> [BotService] Event: Sending out Tweet with access token: ${this.accessToken}`
      );
      const config = {
        method: "post",
        url: "https://api.twitter.com/2/tweets",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: {
          text: message,
        },
      };

      return await axios(config)
        .then(function (response) {
          return response.data;
        })
        .catch(function (error) {
          return error;
        });
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async twitterCreateReply(message: string, tweetId: string) {
    try {
      console.log(
        `=> [BotService] Event: Sending out Reply with access token: ${this.accessToken}`
      );
      const config = {
        method: "post",
        url: `https://api.twitter.com/2/tweets`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: {
          text: message,
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
        },
      };

      return await axios(config)
        .then(function (response) {
          return response.data;
        })
        .catch(function (error) {
          return error;
        });
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }

  async twitterCreateDM(message: string, receiverId: string) {
    try {
      console.log(
        `=> [BotService] Event: Sending out DM with access token: ${this.accessToken}`
      );
      const config = {
        method: "post",
        url: `https://api.twitter.com/2/dm_conversations/with/${receiverId}/messages`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: {
          text: message,
        },
      };

      return await axios(config)
        .then(function (response) {
          return response.data;
        })
        .catch(function (error) {
          return error;
        });
    } catch (err) {
      console.log(`=> [BotService] Error Event: ${err}`);
    }
  }
}

import { createHmac } from "crypto";

export const validatePromptMessage = (prompt: string) => {
  console.log(
    `=> [BotValidator] Function Event: 'VALIDATE PROMPT' :: Prompt ${prompt}`
  );
  return prompt.replace(/[\r\n]+/gm, " ").trim();
};

export const validateBasicAuthenticaation = (authToken: string) => {
  console.log(`=> [BotValidator] Function Event: 'STRING TO BASE64'`);
  return btoa(authToken);
};

export const getChallengeResponse = (crc_token: string) => {
  const hmac = createHmac("sha256", process.env.TWITTER_CONSUMER_SECRET)
    .update(crc_token)
    .digest("base64");

  return hmac;
};

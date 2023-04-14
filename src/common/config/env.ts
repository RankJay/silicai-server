import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

const envVars = () => ({
  database: process.env.DATABASE_URL,
  leap: process.env.LEAP_API_KEY,
  model: process.env.LEAP_AI_MODEL_ID,
  clerk_pk: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerk_sk: process.env.CLERK_SECRET_KEY,
});

const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  // LEAP_API_KEY: Joi.string().uri().required(),
  // LEAP_AI_MODEL_ID: Joi.string().uri().required(),
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Joi.string().uri().required(),
  // CLERK_SECRET_KEY: Joi.string().uri().required(),
});

export const EnvConfig = ConfigModule.forRoot({
  load: [envVars],
  cache: true,
  isGlobal: true,
  validationSchema,
  validationOptions: {
    abortEarly: true,
  },
});

import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

const envVars = () => ({
  database: process.env.DATABASE_URL,
});

const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
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

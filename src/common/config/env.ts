import { ConfigModule } from '@nestjs/config';

const envVars = () => ({
  database: process.env.DATABASE_URL,
  stripe_client: process.env.STRIPE_SK_KEY,
  leap_client: process.env.LEAP_API_KEY,
  replicate_client: process.env.REPLICATE_API_KEY,
  model: process.env.LEAP_AI_MODEL_ID,
  supbase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  clerk_pk: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerk_sk: process.env.CLERK_SECRET_KEY,
  env: process.env.NODE_ENV,
});

export const EnvConfig = ConfigModule.forRoot({
  load: [envVars],
  cache: true,
  isGlobal: true,
  validationOptions: {
    abortEarly: true,
  },
});

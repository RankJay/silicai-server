import { ConfigModule } from '@nestjs/config';

const envVars = () => ({
  database: process.env.DATABASE_URL,
  // stripe_client: process.env.STRIPE_SK_KEY,
  // leap_client: process.env.LEAP_API_KEY,
  // replicate_client: process.env.REPLICATE_API_KEY,
  // replicate_model: process.env.REPLICATE_MODEL,
  // model: process.env.LEAP_AI_MODEL_ID,
  opeai_api_key: process.env.OPEAI_API_KEY,
  supbase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  clerk_pk: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  clerk_sk: process.env.CLERK_SECRET_KEY,
  sendinblue_client: process.env.SENDINBLUE_API_KEY,
  databaseenv: process.env.DATABASEENVIRONMENT,
  daily_limit: process.env.DAILY_GENERATE_LIMIT,
  shipping_fee: process.env.SHIPPING_FEE,
  wombo_api_key: process.env.WOMBO_API_KEY,
});

export const EnvConfig = ConfigModule.forRoot({
  load: [envVars],
  cache: true,
  isGlobal: true,
  validationOptions: {
    abortEarly: true,
  },
});

import { ConfigModule } from '@nestjs/config';

const envVars = () => ({
  database: process.env.DATABASE_URL,
  leap: '28432c52-4130-4a2d-9ea4-1ad6bfeb58bd',
  model: '7575ea52-3d4f-400f-9ded-09f7b1b1a5b8',
  supbase_url: 'https://begypzcqxpmsjbbsbmtd.supabase.co',
  supabase_key:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ3lwemNxeHBtc2piYnNibXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEzNjk0NDcsImV4cCI6MTk5Njk0NTQ0N30.vriKeUpsG7Jfs7_eZU3EI94iE3KzP_JokOkkyGpI67E',
  clerk_pk: 'pk_test_cHJvdmVuLXBvbGVjYXQtNDQuY2xlcmsuYWNjb3VudHMuZGV2JA',
  clerk_sk: 'sk_test_T0oao8JJe7QEr32xPoYdoyQvs5nK17JBi7H2bMVCO5',
  env: 'development',
});

export const EnvConfig = ConfigModule.forRoot({
  load: [envVars],
  cache: true,
  isGlobal: true,
  validationOptions: {
    abortEarly: true,
  },
});

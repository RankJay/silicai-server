import { TypeOrmModule } from '@nestjs/typeorm';

export const DatabaseConfig = TypeOrmModule.forRootAsync({
  // imports: [ConfigModule],
  // inject: [ConfigService],
  useFactory: () => ({
    type: 'postgres',
    url: 'postgresql://postgres:GjHBj9QVgyXN6mQWmpQQ@containers-us-west-2.railway.app:7937/railway',
    autoLoadEntities: true,
    synchronize: true,
  }),
});

export const DatabaseModule = () => {
  return DatabaseConfig;
};

import { TypeOrmModule } from '@nestjs/typeorm';

export const DatabaseConfig = TypeOrmModule.forRootAsync({
  // imports: [ConfigModule],
  // inject: [ConfigService],
  useFactory: () => ({
    type: 'postgres',
    url: 'postgresql://postgres:KSvmIsYKeKnOJztSvhkS@containers-us-west-3.railway.app:7303/railway',
    autoLoadEntities: true,
    synchronize: true,
  }),
});

export const DatabaseModule = () => {
  return DatabaseConfig;
};

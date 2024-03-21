import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

export const DatabaseConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get('database'),
    autoLoadEntities: true,
    synchronize: false, // configService.get('env') !== 'main',
  }),
});

export const DatabaseModule = () => {
  return DatabaseConfig;
};
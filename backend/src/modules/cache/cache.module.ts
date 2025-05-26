import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global() // Add this decorator to make the module global
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true, // Add this to make cache manager globally available
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis');

        return {
          store: redisStore,
          host: redisConfig?.host,
          port: redisConfig?.port,
          password: redisConfig?.password,
          db: redisConfig?.db,
          keyPrefix: redisConfig?.keyPrefix,
          ttl: redisConfig?.ttl,
          max: 100, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

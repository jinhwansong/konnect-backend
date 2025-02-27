import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: process.env.REDIS_PORT,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

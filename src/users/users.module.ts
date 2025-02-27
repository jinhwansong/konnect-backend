import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from 'src/redis/redis.service';
import * as Entities from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(Object.values(Entities))],
  controllers: [UsersController],
  providers: [UsersService, RedisService],
})
export class UsersModule {}

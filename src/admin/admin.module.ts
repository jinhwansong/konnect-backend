import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Entities from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(Object.values(Entities))],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

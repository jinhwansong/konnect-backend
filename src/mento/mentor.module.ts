import { Module } from '@nestjs/common';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Entities from 'src/entities';
@Module({
  imports: [TypeOrmModule.forFeature(Object.values(Entities))],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}

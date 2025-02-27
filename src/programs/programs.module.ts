import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Entities from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(Object.values(Entities))],
  controllers: [ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}

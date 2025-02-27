import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { Reservations } from 'src/entities/Reservations';

@Module({
  imports: [TypeOrmModule.forFeature([MentoringPrograms, Reservations])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}

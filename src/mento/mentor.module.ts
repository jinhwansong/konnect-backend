import { Module } from '@nestjs/common';
import { MentorController } from './mentor.controller';
import { MentorService } from './mentor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentors } from 'src/entities/Mentors';
import { MentorProfile } from 'src/entities/MentorProfile';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mentors, MentorProfile, MentoringPrograms]),
  ],
  controllers: [MentorController],
  providers: [MentorService],
})
export class MentorModule {}

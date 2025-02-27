import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentorProfile } from 'src/entities/MentorProfile';
import { MentoringController } from './mentoring.controller';
import { MentoringService } from './mentoring.service';
import { Contact } from 'src/entities/Contact';
import { AvailableSchedule } from 'src/entities/AvailableSchedule';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { Reservations } from 'src/entities/Reservations';
import { Notification } from 'src/entities/Notification';
import { NotificationService } from 'src/notification/notification.service';
import { Users } from 'src/entities/Users';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservations,
      MentoringPrograms,
      AvailableSchedule,
      Contact,
      MentorProfile,
      Notification,
      Users,
    ]),
  ],
  controllers: [MentoringController],
  providers: [MentoringService, NotificationService],
})
export class MentoringModule {}

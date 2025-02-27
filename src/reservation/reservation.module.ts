import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservations } from 'src/entities/Reservations';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { AvailableSchedule } from 'src/entities/AvailableSchedule';
import { Contact } from 'src/entities/Contact';
import { Payments } from 'src/entities/Payments';
import { PaymentsService } from 'src/payments/payments.service';
import { HttpModule } from '@nestjs/axios';
import { MentorProfile } from 'src/entities/MentorProfile';
import { Users } from 'src/entities/Users';
import { Notification } from 'src/entities/Notification';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservations,
      MentoringPrograms,
      AvailableSchedule,
      Contact,
      Payments,
      MentorProfile,
      Notification,
      Users,
    ]),
    HttpModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService, PaymentsService],
})
export class ReservationModule {}

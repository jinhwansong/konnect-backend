import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from 'src/payments/payments.service';
import { HttpModule } from '@nestjs/axios';
import * as Entities from 'src/entities';

@Module({
  imports: [TypeOrmModule.forFeature(Object.values(Entities)), HttpModule],
  controllers: [ReservationController],
  providers: [ReservationService, PaymentsService],
})
export class ReservationModule {}

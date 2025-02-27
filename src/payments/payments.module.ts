import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payments } from 'src/entities/Payments';
import { Reservations } from 'src/entities/Reservations';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forFeature([Payments, Reservations]),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

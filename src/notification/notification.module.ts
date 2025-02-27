import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/entities/Notification';
import { Users } from 'src/entities/Users';
import { Reservations } from 'src/entities/Reservations';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Users, Reservations])],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}

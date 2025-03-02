import { PickType } from '@nestjs/swagger';
import { Notification } from 'src/entities';

export class NotificationDto extends PickType(Notification, [
  'message',
  'type',
  'userId',
  'reservationId',
  'programId',
]) {}

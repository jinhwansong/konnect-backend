import { PickType } from '@nestjs/swagger';
import { Notification } from 'src/entities';

export class GetNotificationDto extends PickType(Notification, [
  'message',
  'id',
  'reservationId',
  'isRead',
]) {}

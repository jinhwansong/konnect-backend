import { PickType } from '@nestjs/swagger';
import { Notification } from 'src/entities/Notification';
import { Users } from 'src/entities/Users';

export class createNoti extends PickType(Notification, [
  'userId',
  'reservationId',
  'message',
  'type',
  'programId',
]) {}

export class updateNoti extends PickType(Users, ['fcmToken']) {}

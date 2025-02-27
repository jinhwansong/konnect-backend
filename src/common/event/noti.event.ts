import { NotificationType } from 'src/entities/Notification';

export class NotiEvent {
  constructor(
    public userId: number,
    public message: string,
    public type: NotificationType,
    public reservationId: number,
    public programId: number,
  ) {}
}

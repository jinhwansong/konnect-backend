import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification, Reservations } from 'src/entities';
import { Between, EntityManager, Repository } from 'typeorm';
import { NotificationDto } from './dto/notification.request.dto';
import { Cron } from '@nestjs/schedule';
import { MemtoringStatus } from 'src/entities/Reservations';
import { NotificationType } from 'src/entities/Notification';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notiRepository: Repository<Notification>,
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
    private notificationGateway: NotificationGateway,
  ) {}
  // 알람 생성
  async create(
    notification: NotificationDto,
    entityManager?: EntityManager,
  ): Promise<Notification> {
    const manager = entityManager || this.notiRepository.manager;
    const noti = manager.create(Notification, {
      ...notification,
      isRead: false,
    });
    return manager.save(noti);
  }
  // 사용자 알림 조회
  async findUserNoti(userId: number) {
    const noti = await this.notiRepository.find({
      where: { recipientId: userId }, // 수신자 ID로 필터링
      order: { createdAt: 'DESC' },
      relations: ['sender', 'reservation', 'programs'], // 'user'는 발신자
    });
    const item = noti.map((notis) => ({
      id: notis.id,
      isRead: notis.isRead,
      message: notis.message,
      reservationId: notis.reservationId,
      createdAt: notis.createdAt,
      image: notis.sender.image,
    }));
    return {
      message: '알림 조회가 완료됬습니다.',
      item,
    };
  }
  // 알람 읽음 표시
  async markAsRead(userId: number, notiId: number) {
    const notification = await this.notiRepository.findOne({
      where: { id: notiId, recipientId: userId },
    });

    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다.');
    }
    await this.notiRepository.update(
      { recipientId: userId, id: notiId },
      { isRead: true },
    );
    return { message: '해당 알림을 읽었습니다.' };
  }
  // 모든알람 읽음 표시
  async markAllAsRead(userId: number) {
    await this.notiRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { message: '모든 알림을 읽었습니다.' };
  }
  // 알림 삭제
  async remove(userId: number, notiId: number) {
    const notification = await this.notiRepository.findOne({
      where: { id: notiId, recipientId: userId },
    });

    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다.');
    }
    await this.notiRepository.delete({ recipientId: userId, id: notiId });
    return { message: '해당 알림을 삭제했습니다.' };
  }
  // 모든알람 삭제 표시
  async removeAll(userId: number) {
    await this.notiRepository.delete({ recipientId: userId });
    return { message: '모든 알림을 삭제했습니다.' };
  }
  // 10분전 알림
  @Cron('* * * * *')
  async sendMentoringReminders() {
    try {
      const now = new Date();
      // 10분전
      const tenMinutes = new Date(now.getTime() + 10 * 60 * 1000);
      // 9분전에는 발송 금지
      const nineMinutes = new Date(now.getTime() + 9 * 60 * 1000);
      // 10분후에 시작하는 멘토링 예약 조회
      const upcommingMentoring = await this.reservationRepository.find({
        where: {
          status: MemtoringStatus.PROGRESS,
          // 시작하기 10분전과 9분전 사이의 것만
          // 이미 보냇으면 필터링을 해야한다.
          startTime: Between(nineMinutes, tenMinutes),
          reminderSent: false,
        },
        relations: [
          'user',
          'programs',
          'programs.profile',
          'programs.profile.user',
        ],
      });
      // 각 예약에 알림 생성 / 전송
      for (const mentoring of upcommingMentoring) {
        // 멘티에게 알림
        await this.createMentoringReminder(
          mentoring.programs.profile.user.id, // 멘토 발신자
          mentoring.user.id, // 멘티 수신자
          mentoring.id, // 예약된 번호
          mentoring.programs.id, // 프로그램 아이디
          mentoring.programs.title, // 프로그램 이름
          '10분 후',
        );
        // 멘토에게 알림
        await this.createMentoringReminder(
          mentoring.user.id, // 멘티 발신자
          mentoring.programs.profile.user.id, // 멘토 수신자
          mentoring.id, // 예약된 번호
          mentoring.programs.id, // 프로그램 아이디
          mentoring.programs.title, // 프로그램 이름
          '10분 후',
        );
        // 알림이 발송되었음을 표시하기 위해 예약 상태 업데이트
        await this.reservationRepository.update(
          { id: mentoring.id },
          { reminderSent: true }, // Reservations 엔티티에 이 필드를 추가해야 함
        );
      }
    } catch (e) {
      console.error('10분전 알림 에러낫다..', e);
    }
  }
  // 마감 임박 메시지 전송
  private async createMentoringReminder(
    senderId: number, // 발신자
    recipientId: number, // 수신자
    reservationId: number, // 예약된 번호
    programId: number, // 프로그램 아이디
    programTitle: string, // 프로그램 이름
    time: string, // 멘토링 시작까지 시간
  ) {
    // 알림 메시지
    const message = `${programTitle} 멘토링이 ${time} 시작됩니다.`;
    // 알림 생성
    const noti = await this.notiRepository.save({
      userId: senderId, // 발신자
      recipientId, // 수신자
      message,
      type: NotificationType.MENTORING_UPCOMING,
      reservationId,
      programId,
      isRead: false,
    });
    // 알림 전송
    this.notificationGateway.sendNotificationToUser(recipientId, noti);
    return noti;
  }
}

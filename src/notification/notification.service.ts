import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities';
import { EntityManager, Repository } from 'typeorm';
import { NotificationDto } from './dto/notification.request.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notiRepository: Repository<Notification>,
  ) {}
  // 알람 생성
  async create(
    notification: NotificationDto,
    entityManager?: EntityManager,
  ): Promise<Notification> {
    const manager = this.notiRepository.manager || entityManager;
    const noti = manager.create(Notification, {
      ...notification,
      isRead: false,
    });
    return manager.save(noti);
  }
  // 사용자 알림 조회
  async findUserNoti(userId: number) {
    const noti = await this.notiRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['reservation', 'programs'],
    });
    const item = noti.map((notis) => ({
      id: notis.id,
      isRead: notis.isRead,
      message: notis.message,
      reservationId: notis.reservationId,
    }));
    return {
      message: '알림 조회가 완료됬습니다.',
      item,
    };
  }
  // 알람 읽음 표시
  async markAsRead(userId: number, notiId: number) {
    await this.notiRepository.update({ userId, id: notiId }, { isRead: true });
    return { message: '해당 알림을 읽었습니다.' };
  }
  // 모든알람 읽음 표시
  async markAllAsRead(userId: number) {
    await this.notiRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { message: '모든 알림을 읽었습니다.' };
  }
  // 알림 삭제
  async remove(userId: number, notiId: number) {
    await this.notiRepository.delete({ userId, id: notiId });
    return { message: '해당 알림을 삭제했습니다.' };
  }
  // 모든알람 삭제 표시
  async removeAll(userId: number) {
    await this.notiRepository.delete(userId);
    return { message: '모든 알림을 삭제했습니다.' };
  }
}

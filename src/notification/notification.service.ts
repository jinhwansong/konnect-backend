import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification, NotificationType } from 'src/entities/Notification';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { createNoti } from './dto/noti.respones.dto';
import { Users } from 'src/entities/Users';
import { Reservations } from 'src/entities/Reservations';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notiRepository: Repository<Notification>,
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }
  // 알림 생성 및 fcm 생성
  async createNoti(body: createNoti) {
    try {
      // db에 데이터 저장
      const noti = await this.notiRepository.save({
        userId: body.userId,
        message: body.message,
        type: body.type,
        reservationId: body.reservationId,
        programId: body.programId,
      });
      // FCM 토큰 조회 및 알림 전송
      const user = await this.userRepository.findOne({
        where: { id: body.userId },
        select: ['fcmToken'],
      });
      if (user?.fcmToken) {
        await this.sendFcm(
          user.fcmToken,
          this.getNotiTitle(body.type),
          body.message,
          {
            type: body.type,
            reserveationId: body.reservationId,
            programId: body.programId,
          },
        );
      }
      return noti;
    } catch (error) {
      console.error('FCM 알림 전송 실패:', error);
    }
  }
  // fcm 알림전송
  private async sendFcm(token: string, title: string, body: string, data: any) {
    try {
      const message = {
        notification: { title, body },
        data: data || {},
        token,
      };
      return await admin.messaging().send(message);
    } catch (error) {
      console.error('메시지 전송중 문제 생김', error);
    }
  }
  private getNotiTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.RESERVATION_REQUESTED:
        return '새로운 멘토링이 예약되었습니다.';
      case NotificationType.RESERVATION_CONFIRMED:
        return '멘토링 예약이 승인되었습니다.';
      case NotificationType.RESERVATION_REJECTED:
        return '멘토링 예약이 거절되었습니다.';
      case NotificationType.RESERVATION_CANCELLED:
        return '멘토링 예약이 취소되었습니다.';
      case NotificationType.MENTORING_UPCOMING:
        return '곧 멘토링이 시작됩니다.';
      case NotificationType.MENTORING_STARTED:
        return '멘토링이 시작됬습니다.';
      case NotificationType.MENTORING_COMPLETED:
        return '멘토링이 완료되었습니다.';
      case NotificationType.REVIEW_RECEIVED:
        return '새 리뷰가 작성되었습니다.';
      case NotificationType.NEW_FOLLOWER:
        return '새로운 팔로우가 추가 됬습니다.';
      case NotificationType.POST_LIKED:
        return '게시물에 좋아요가 추가 됬습니다.';
    }
  }
  // 토큰등록 업데이트
  async updateFcmToken(id: number, token: string) {
    await this.userRepository.update(id, { fcmToken: token });
    return { message: '토큰이 업데이트 되었습니다.' };
  }
  // 토큰 삭제
  async deleteFcmToken(id: number) {
    await this.userRepository.update(id, { fcmToken: null });
    return { message: '토큰이 삭제되었습니다.' };
  }
  // 사용자 알림 목록 조회
  async getNotifications(id: number) {
    try {
      const noti = this.notiRepository.findOne({
        where: { id },
        select: ['id', 'message', 'isRead', 'createdAt'],
        order: { createdAt: 'DESC' },
      });
      return {
        message: '알림 목록이 성공적으로 조회되었습니다.',
        noti: noti,
      };
    } catch (error) {
      throw new BadRequestException(
        '알림 목록을 불러오던 중 오류가 발생했습니다.',
      );
    }
  }
  // 알림 읽음 처리
  async markAsRead(userId: number, id: number) {
    const read = await this.notiRepository.update(
      { id, userId },
      { isRead: true },
    );
    if (read.affected === 0) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }
    return { message: '알림이 읽음 처리 되었습니다.' };
  }
  // 알림 삭제 처리
  async deleteNoti(userId: number, id: number) {
    const read = await this.notiRepository.delete({ id, userId });
    if (read.affected === 0) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }
    return { message: '알림이 삭제되었습니다.' };
  }
  // 곧 시작되는 멘토링 알림
  // @Cron('0 * * * * ')
  // async sandupComing() {
  //   try {
  //     const now = new Date();
  //     const onHour = new Date(now.getTime() + 10 * 60 * 1000);
  //     // 10분 안에 시작되는 멘토링 조회
  //     const upcommingReservations = await this.reservationRepository.findOne({
  //       where
  //     });
  //   } catch (error) {
  //     throw new BadRequestException('자동 알림 생성 중 오류가 발생했습니다.');
  //   }
  // }
}

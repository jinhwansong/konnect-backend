import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './Users';
import { Reservations } from './Reservations';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { MentoringPrograms } from './MentoringPrograms';

// 알람 타입
export enum NotificationType {
  // 새로운 예약 신청
  RESERVATION_REQUESTED = 'reservation_requested',

  // 예약 승인됨
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  // 예약 거절됨
  RESERVATION_REJECTED = 'reservation_rejected',
  // 예약 취소됨
  RESERVATION_CANCELLED = 'reservation_cancelled',

  // 멘토링 예정 알림
  MENTORING_UPCOMING = 'mentoring_upcoming',
  // 멘토링 시작
  MENTORING_STARTED = 'mentoring_started',
  // 멘토링 완료
  MENTORING_COMPLETED = 'mentoring_completed',

  // 새 리뷰 작성됨 (멘티 → 멘토)
  REVIEW_RECEIVED = 'review_received',

  // 새로운 팔로워
  NEW_FOLLOWER = 'new_follower',
  // 게시물 좋아요
  POST_LIKED = 'post_liked',
}
@Entity({ schema: 'konnect', name: 'notification' })
export class Notification {
  // 키값
  @ApiProperty({ example: 1, description: 'id', required: true })
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '자격요건 미달',
    description: '거절 사유 (거절시에만 필요)',
    required: false,
  })
  @Column('text', { nullable: true })
  message: string | null;
  @Column('enum', {
    enum: NotificationType,
    default: NotificationType.MENTORING_UPCOMING,
  })
  type: NotificationType;
  @IsBoolean()
  @ApiProperty({
    example: 'false',
    description: '않읽엇을시',
    required: false,
  })
  @Column({ default: false })
  isRead: boolean;
  @Column()
  userId: number;
  @Column({ nullable: true })
  reservationId: number;
  @Column({ nullable: true })
  programId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 유저와 관계설정
  @ManyToOne(() => Users, (user) => user.notification)
  @JoinColumn({ name: 'userId' })
  user: Users;
  // 예약 관계설정
  @ManyToOne(() => Reservations, (reservation) => reservation.notification)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservations;
  @ManyToOne(() => MentoringPrograms, (program) => program.notification)
  @JoinColumn({ name: 'programId' })
  programs: MentoringPrograms;
}

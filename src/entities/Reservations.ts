import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Payments } from './Payments';
import { MentoringPrograms } from './MentoringPrograms';
import { Users } from './Users';
import { AvailableSchedule } from './AvailableSchedule';
import { Contact } from './Contact';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Notification } from './Notification';
import { ChatRoom } from './ChatRoom';

// 멘토링 현황
export enum MemtoringStatus {
  // 대기
  PENDING = 'pending',
  // 승인전
  COMFIRMED = 'confirmed',
  // 취소
  CANCELLED = 'cancelled',
  // 완료
  COMPLETED = 'completed',
  // 승인후
  PROGRESS = 'progress',
}
@Entity({ schema: 'konnect', name: 'reservations' })
export class Reservations {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 예약된 시간
  @IsDateString()
  @ApiProperty({
    example: '2022-01-01T09:00:00Z',
    description: '멘토링 시작 시간',
  })
  @Column('datetime')
  startTime: Date;
  // 예약 종료된 시간
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({
    example: '2022-01-01 10:00:00Z',
    description: '멘토링 종료 시간',
  })
  @Column('datetime')
  endTime: Date;
  @Column()
  programsId: number;
  // 멘토링 현황
  @ApiProperty({
    example: MemtoringStatus.PENDING,
    description: '멘토링 현황',
    enum: MemtoringStatus,
  })
  @Column('enum', {
    name: 'status',
    enum: MemtoringStatus,
    default: MemtoringStatus.PENDING,
  })
  status: MemtoringStatus;
  @ApiProperty({
    example: true,
    description: '승인 여부',
  })
  @IsBoolean()
  @Column({ default: false })
  approved: boolean;
  // 거절사유
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '자격요건 미달',
    description: '거절 사유 (거절시에만 필요)',
    required: false,
  })
  @Column('text', { nullable: true })
  reason?: string | null;
  @Column({ default: false })
  reminderSent: boolean;
  @Column()
  userId: number;
  @Column({ type: 'timestamp', nullable: true })
  expire: Date;
  @Column()
  scheduleId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 결제 관계설정
  @OneToOne(() => Payments, (payment) => payment.reservation)
  payment: Payments;
  // 프로그램과 관계설정
  @ManyToOne(() => MentoringPrograms, (program) => program.reservation)
  programs: MentoringPrograms;
  // 유저와의 관계
  @ManyToOne(() => Users, (user) => user.reservations)
  user: Users;
  // 예약가능한시간 관계설정
  @ManyToOne(() => AvailableSchedule, (schedule) => schedule.reservation)
  @JoinColumn({ name: 'scheduleId' })
  schedule: AvailableSchedule;
  // 승인과의 관계
  @OneToMany(() => Notification, (notification) => notification.reservation)
  notification: Notification[];
  // 연락처
  @OneToOne(() => Contact, (contact) => contact.reservation, {
    cascade: true,
  })
  contact: Contact;
  // 채팅방 관계설정
  @OneToOne(() => ChatRoom, (room) => room.reservations)
  room: ChatRoom;
}

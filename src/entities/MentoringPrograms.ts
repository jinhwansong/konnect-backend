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
import { MentorProfile } from './MentorProfile';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Reservations } from './Reservations';
import { AvailableSchedule } from './AvailableSchedule';
import { Notification } from './Notification';
import { Review } from './Review';

// 프로그램 활성화
export enum ProgramStatus {
  ACTIVE = 'active',
  INACTIVITY = 'inactivity',
}

@Entity({ schema: 'konnect', name: 'mentoringprograms' })
export class MentoringPrograms {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 멘토링 제목
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '실무자와 함께하는 마케팅 기초',
    description: '멘토링 제목',
    required: true,
  })
  @Column('varchar', { length: 100 })
  title: string;
  // 멘토링 내용
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '마케팅의 기초부터 실무에서 사용하는 전략까지...',
    description: '멘토링 내용',
    required: true,
  })
  @Column('text')
  content: string;
  // 멘토링 가격
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: '30000',
    description: '멘토링비용',
    required: true,
  })
  @Column('int')
  price: number;
  // 1회당 멘토링 가능 시간
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: '60',
    description: '1회당 멘토링 시간 (분 단위)',
    required: true,
  })
  @Column('int')
  duration: number;
  // 멘토링분야
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '데이터사이언스',
    description: '멘토링분야',
    required: true,
  })
  @Column('varchar')
  mentoring_field: string;
  // 프로그램 상태
  @ApiProperty({
    example: ProgramStatus.ACTIVE,
    description: '프로그램 상태',
    enum: ProgramStatus,
  })
  @Column('enum', {
    enum: ProgramStatus,
    default: ProgramStatus.ACTIVE,
  })
  status: ProgramStatus;
  @Column()
  profileId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 멘토프로필과의 관계설정
  @ManyToOne(() => MentorProfile, (profile) => profile.programs)
  @JoinColumn({ name: 'profileId' })
  profile: MentorProfile;
  // 예약일정 관계설정
  @OneToMany(() => Reservations, (reservation) => reservation.programs)
  reservation: Reservations[];
  // 예약 가능
  @OneToOne(() => AvailableSchedule, (schedule) => schedule.programs)
  available: AvailableSchedule;
  // 승인과의 관계
  @OneToMany(() => Notification, (notification) => notification.programs)
  notification: Notification[];
  // 리뷰과의 관계
  @OneToMany(() => Review, (review) => review.program)
  reviews: Review[];
}

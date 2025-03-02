import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './Users';
import { Reservations } from './Reservations';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

@Entity({ schema: 'konnect', name: 'payments' })
export class Payments {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  @Column({ length: 64 })
  @ApiProperty({ description: '주문 번호', example: 'ord_202402191234' })
  orderId: string;
  // 가격
  @ApiProperty({ description: '결제 금액', example: 50000 })
  @Column('int')
  price: number;
  // 결제한 멘토링 이름
  @ApiProperty({
    description: '결제한 멘토링 제목',
    example: '커리어 상담 30분',
  })
  @Column()
  title: string;
  // 토스 페이먼츠 결제 고유번호
  @ApiProperty({
    description: '토스 페이먼츠 결제 고유번호',
    required: false,
    example: '5zJ4xY7m9wAqBnE2vN8k',
  })
  @Column({ nullable: true })
  paymentKey: string;
  // 결제시간
  @ApiProperty({
    description: '결제 완료 시간',
    required: false,
    example: '2024-02-19T12:34:56.789Z',
  })
  @Column({ nullable: true })
  paidAt: Date;
  // 결제 상태
  @ApiProperty({
    description: '결제 상태',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    example: PaymentStatus.COMPLETED,
  })
  // 영수증 링크
  @Column({ nullable: true })
  receiptUrl: string;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;
  @Column()
  reservationId: number;
  @Column()
  userId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 유저과의 관계
  @ManyToOne(() => Users, (user) => user.payments)
  @JoinColumn({ name: 'userId' })
  user: Users;
  // 예약과의 관계
  @OneToOne(() => Reservations, (reservations) => reservations.payment)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservations;
}

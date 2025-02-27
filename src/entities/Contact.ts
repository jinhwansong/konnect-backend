import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservations } from './Reservations';

@Entity({ schema: 'konnect', name: 'contact' })
export class Contact {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 멘토에게 줄 연락처
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '01012345678',
    description: '휴대폰번호',
    required: true,
  })
  @Column('varchar', { length: 11 })
  phone: string;
  // 멘토에게 줄 이메일
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'example@gmail.com',
    description: '연락받을 이메일 주소',
    required: true,
  })
  @Column('varchar', {
    name: 'email',
    length: 30,
  })
  email: string;
  // 멘토에게 줄 메시지
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '이거때문에 멘토링을 신청했습니다 ㅠㅠ',
    description: '멘토링 신청 이유',
    required: true,
  })
  @Column('text')
  message: string;
  @Column()
  reservationId: number;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @OneToOne(() => Reservations, (reservations) => reservations.contact)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservations;
}

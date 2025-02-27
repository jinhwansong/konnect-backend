import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Users } from './Users';
import { Status } from '../common/enum/status.enum';

@Entity({ schema: 'konnect', name: 'mentors' })
export class Mentors {
  // 키값
  @ApiProperty({ example: 1, description: 'id', required: true })
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 이메일
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'example@gmail.com',
    description: '연락받을 이메일 주소',
    required: true,
  })
  @Column('varchar', {
    length: 30,
    unique: true,
    nullable: true,
  })
  email: string;
  // 멘토링희망분야
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '데이터사이언스',
    description: '멘토링 희망분야',
    required: true,
  })
  @Column('varchar')
  job: string;
  // 멘토 연차
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '주니어(1~3년)',
    description: '연차',
    required: true,
  })
  @Column('varchar')
  career: string;
  // 멘토자기소개
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      '"저는 프론트엔드 개발자로 5년간 일해왔으며, 이제 후배 개발자들에게 저의 경험을 나누고 싶습니다."',
    description: '자기소개',
    required: true,
  })
  @Column('text')
  introduce: string;
  // 멘토포트폴리오
  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({
    example: 'https://portfolio.example.com',
    description: '포트폴리오 페이지 url',
    required: true,
  })
  @Column('varchar')
  portfolio: string;
  // 통과여부
  @ApiProperty({
    example: true,
    description: '승인 여부',
  })
  @IsBoolean()
  @Column('enum', { enum: Status, default: Status.PENDING })
  status: Status;
  // 거절사유
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '자격요건 미달',
    description: '거절 사유 (거절시에만 필요)',
    required: false,
  })
  @Column('text', { nullable: true })
  reason: string | null;
  @Column()
  userId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 유저와 관계 설정
  @OneToOne(() => Users, (user) => user.mentor)
  @JoinColumn({ name: 'userId' })
  user: Users;
}

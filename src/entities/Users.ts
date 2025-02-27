import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Likes } from './Likes';
import { Mentors } from './Mentors';
import { Comments } from './Comments';
import { Payments } from './Payments';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBase64,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { SocialLoginProvider, UserRole } from '../common/enum/status.enum';
import { Reservations } from './Reservations';
import { MentorProfile } from './MentorProfile';
import { Notification } from './Notification';
import { Review } from './Review';

@Entity({ schema: 'konnect', name: 'users' })
export class Users {
  // 키값
  @ApiProperty({ example: 1, description: 'id', required: true })
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 이메일
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'example@gmail.com',
    description: '이메일',
    required: true,
  })
  @Column('varchar', {
    name: 'email',
    length: 30,
    unique: true,
    nullable: true,
  })
  email: string;
  // 비밀번호
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '123456Q!',
    description: '비밀번호',
    required: true,
  })
  @Column('varchar', {
    name: 'password',
    length: 100,
    nullable: true,
    select: false,
  })
  password: string | null;
  //닉네임
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '지젤',
    description: '닉네임',
    required: true,
  })
  @Column('varchar', { name: 'nickname', length: 30, unique: true })
  nickname: string;
  // 이름
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '지젤',
    description: '이름',
    required: true,
  })
  @Column('varchar', { name: 'name', length: 30 })
  name: string;
  // 전화번호
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '01012345678',
    description: '휴대폰번호',
    required: true,
  })
  @Column('varchar', { name: 'phone', length: 11, unique: true })
  phone: string;
  // 프로필이미지
  @IsBase64()
  @ApiProperty({
    required: true,
    example:
      'https://fastly.picsum.photos/id/1062/200/300.jpg?hmac=e6D9R3lyQ0AtilxM2LGviSrodxvroxcpCRm2FdfNwZg',
    description: '유저프로필',
  })
  @Column('varchar', { name: 'image', length: 200, nullable: true })
  image: string;
  // 소셜로그인
  // 일반회원일수 잇기때문에 null로 설정
  @IsEnum(SocialLoginProvider)
  @Column('enum', {
    enum: SocialLoginProvider,
    nullable: true,
    default: SocialLoginProvider.LOCAL,
  })
  socialLoginProvider: SocialLoginProvider | null;
  // snsid
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'snsid',
    required: false,
  })
  @Column('varchar', { name: 'snsid', nullable: true, unique: true })
  snsId: string | null;
  @ApiProperty({
    example: 'eIpUVfeJRJiup-flJ5...',
    description: 'Firebase Cloud Messaging 토큰',
  })
  @IsString()
  @IsNotEmpty()
  @Column({ nullable: true })
  fcmToken: string;
  // 유저등급
  @ApiProperty({
    example: 'user',
    description: '유저등급',
  })
  @Column('enum', { enum: UserRole, default: UserRole.USER })
  role: UserRole;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;
  // 멘토 신청 관계설정
  @OneToOne(() => Mentors, (Mentor) => Mentor.user)
  mentor: Mentors;
  // 멘토 프로필 관계설정
  @OneToOne(() => MentorProfile, (profile) => profile.user)
  profile: MentorProfile;
  // 게시물 댓글 관계설정
  @OneToMany(() => Comments, (Comment) => Comment.users)
  comments: Comments[];
  // 게시물 좋아요
  @OneToMany(() => Likes, (like) => like.users)
  likes: Likes[];
  // 결제 관계설정
  @OneToMany(() => Payments, (payment) => payment.user)
  payments: Payments[];
  // 예약과의 관계
  @OneToMany(() => Reservations, (reservations) => reservations.user)
  reservations: Reservations[];
  // 승인과의 관계
  @OneToMany(() => Notification, (reservations) => reservations.user)
  notification: Notification[];
  // 리뷰과의 관계
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}

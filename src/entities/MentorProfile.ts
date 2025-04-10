import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MentoringPrograms } from './MentoringPrograms';
import { Posts } from './Posts';
import { IsBase64, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Users } from './Users';

@Entity({ schema: 'konnect', name: 'mentorprofile' })
export class MentorProfile {
  // 키값
  @ApiProperty({ example: 1, description: 'id', required: true })
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 멘토 회사정보
  @IsString()
  @ApiProperty({
    example: '네카라쿠베',
    description: '회사정보',
  })
  @Column('varchar', { name: 'company', nullable: true })
  company: string;
  // 전문분야
  @IsString()
  @ApiProperty({
    example: '프론트엔드',
    description: '전문분야',
  })
  @Column('varchar', { name: 'position', nullable: true })
  position: string;
  // 멘토자기소개
  @IsString()
  @MaxLength(3000)
  @ApiProperty({
    example:
      '"저는 프론트엔드 개발자로 5년간 일해왔으며, 이제 후배 개발자들에게 저의 경험을 나누고 싶습니다."',
    description: '자기소개',
  })
  @Column('text', { name: 'introduce', nullable: true })
  introduce: string;
  // 프로필이미지
  @IsBase64()
  @ApiProperty({
    example:
      'https://fastly.picsum.photos/id/1062/200/300.jpg?hmac=e6D9R3lyQ0AtilxM2LGviSrodxvroxcpCRm2FdfNwZg',
    description: '유저프로필',
  })
  @Column('varchar', {
    name: 'image',
    length: 200,
    nullable: true,
  })
  image: string;
  @Column({ name: 'userId' })
  userId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 멘토링 프로그램과의 관계설정
  @OneToMany(() => MentoringPrograms, (program) => program.profile)
  programs: MentoringPrograms[];
  // 게시물과의 관계설정
  @OneToMany(() => Posts, (post) => post.profile)
  posts: Posts[];
  // 유저 엔티티
  @OneToOne(() => Users, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: Users;
}

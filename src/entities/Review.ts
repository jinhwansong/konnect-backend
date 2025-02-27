import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
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
import { MentoringPrograms } from './MentoringPrograms';

@Entity({ schema: 'konnect', name: 'review' })
export class Review {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 평점
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(5)
  @ApiProperty({
    example: 4.5,
    description: '프로그램 평점 (0-5점)',
    minimum: 0,
    maximum: 5,
    required: true,
  })
  @Column('decimal', {
    precision: 2,
    scale: 1,
  })
  rating: number;
  // 리뷰 내용
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '멘토님이 친절하게 설명해주셔서 많은 도움이 되었습니다.',
    description: '리뷰 내용',
    required: true,
  })
  @Column('text')
  content: string;

  // 멘토링 프로그램 ID
  @Column()
  programId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  // 유저과의 관계
  @ManyToOne(() => Users, (user) => user.reviews)
  @JoinColumn({ name: 'userId' })
  user: Users;
  // 프로그램과의 관계
  @ManyToOne(() => MentoringPrograms, (program) => program.reviews)
  @JoinColumn({ name: 'programId' })
  program: MentoringPrograms;
}

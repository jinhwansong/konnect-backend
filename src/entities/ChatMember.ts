import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../common/enum/status.enum';
import { Users } from './Users';
import { ChatRoom } from './ChatRoom';

@Entity({ schema: 'konnect', name: 'chatmember' })
export class ChatMember {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 유저등급
  @ApiProperty({
    example: 'mentee',
    description: '유저등급',
    enum: UserRole,
    default: UserRole.MENTEE,
  })
  @Column('enum', { enum: UserRole, default: UserRole.MENTEE })
  role: UserRole;
  @ApiProperty({
    example: false,
    description: '활성 상태 여부',
    default: false,
  })
  @Column({ default: false })
  isActive: boolean;
  @ApiProperty({
    example: '1',
    description: '채팅방 ID',
  })
  @Column()
  chatRoomId: string;
  @ApiProperty({
    example: 42,
    description: '사용자 ID',
  })
  @Column()
  userId: number;
  @ApiProperty({
    example: '2025-03-06T12:00:00Z',
    description: '채팅방 참여 시간',
  })
  @CreateDateColumn()
  joinedAt: Date;
  @ApiProperty({
    example: '2025-03-06T15:30:00Z',
    description: '마지막 업데이트 시간',
  })
  @UpdateDateColumn()
  updatedAt: Date;
  // 유저 관계설정
  @ManyToOne(() => Users, (user) => user.chatmember, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Users;
  // 채팅방 관계설정
  @ManyToOne(() => ChatRoom, (room) => room.chatmember)
  @JoinColumn({ name: 'chatRoomId' })
  room: ChatRoom;
}

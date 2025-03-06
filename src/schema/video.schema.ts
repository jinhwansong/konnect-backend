import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MessageDocument = VideoCall & Document;

export enum CallStatus {
  INITIATED = 'initiated',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
}

// 참여자 정보
class Participant {
  @ApiProperty({
    example: 42,
    description: '참여자 ID',
  })
  @Prop({ required: true })
  userId: number;
  @ApiProperty({
    example: '2025-03-06T12:00:00Z',
    description: '참여 시간',
  })
  @Prop({ default: Date.now })
  joinedAt: Date;

  @ApiProperty({
    example: '2025-03-06T12:30:00Z',
    description: '퇴장 시간',
    required: false,
  })
  @Prop()
  leftAt?: Date;
}
@Schema({ timestamps: true })
export class VideoCall {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: '화상통화 ID',
  })
  _id: string;
  @ApiProperty({
    example: 'chat-1',
    description: '채팅방 ID',
  })
  @Prop({ required: true, index: true })
  chatRoomId: string;
  @ApiProperty({
    example: 42,
    description: '발신자 ID',
  })
  @Prop({ required: true })
  senderId: number;
  @ApiProperty({
    example: 'session-xyz-123',
    description: 'webRTC ID',
    required: false,
  })
  @Prop({ required: true })
  sessionId?: string;
  @ApiProperty({
    enum: CallStatus,
    example: 'active',
    description: '통화 상태',
    default: CallStatus.INITIATED,
  })
  @Prop({ default: CallStatus.INITIATED })
  status: string;
  @ApiProperty({
    example: '2025-03-06T12:00:00Z',
    description: '통화 시작 시간',
  })
  @Prop({ default: Date.now })
  startedAt: Date;
  @Prop()
  endedAt?: Date;
  @ApiProperty({
    example: 1800,
    description: '통화 시간 (초)',
    required: false,
  })
  @Prop()
  duration?: number;

  @ApiProperty({
    type: [Participant],
    description: '통화 참여자 목록',
  })
  @Prop({ type: [Object], default: [] })
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
}
export const MessageSchema = SchemaFactory.createForClass(VideoCall);
MessageSchema.index({ chatRoomId: 1, startedAt: -1 });

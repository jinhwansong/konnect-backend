import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  SYSTEM = 'system ',
}

@Schema({ timestamps: true })
export class Message {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: '메시지 ID',
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
    example: '안녕하세요! 멘토링 일정은 언제가 좋을까요?',
    description: '메시지 내용',
  })
  @Prop()
  content: string;
  @ApiProperty({
    enum: MessageType,
    example: 'text',
    description: '메시지 타입',
    default: MessageType.TEXT,
  })
  @Prop({ default: MessageType.TEXT })
  type: string;

  @ApiProperty({
    example: 'https://storage.example.com/files/document.pdf',
    description: '파일 URL',
    required: false,
  })
  @Prop()
  fileUrl?: string;

  @ApiProperty({
    example: 'document.pdf',
    description: '파일 이름',
    required: false,
  })
  @Prop()
  fileName?: string;

  @ApiProperty({
    example: 1024000,
    description: '파일 크기 (바이트)',
    required: false,
  })
  @Prop()
  fileSize?: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: '메시지를 읽은 사용자 ID 목록',
    default: [],
  })
  @Prop({ default: [] })
  readBy: number[];

  @ApiProperty({
    example: false,
    description: '삭제 여부',
    default: false,
  })
  @Prop({ default: false })
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ chatRoomId: 1, createdAt: -1 });

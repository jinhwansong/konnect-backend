import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Entities from '../entities';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schema/message.schema';
import { VideoCall, VideoCallSchema } from 'src/schema/video.schema';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(Entities)),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: VideoCall.name, schema: VideoCallSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}

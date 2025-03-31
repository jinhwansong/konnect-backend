import { PickType } from '@nestjs/swagger';
import { ChatRoom } from 'src/entities/ChatRoom';
import { Message } from 'src/schema/message.schema';

export class CreateRoomDTO extends PickType(ChatRoom, ['chatRoomId']) {}
export class SendMessageDto extends PickType(Message, ['content']) {}

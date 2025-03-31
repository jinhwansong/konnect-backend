import { ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { Message, MessageDocument } from 'src/schema/message.schema';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMember } from 'src/entities';
import { Repository } from 'typeorm';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private readonly redisService: RedisService,
  ) {}
  // 같은 아이디로 여러 기기에서 접속시
  private userSocketMap = new Map<number, string[]>();
  // 채팅방 관리
  private chatSocketMap = new Map<string, string>();
  @WebSocketServer() public server: Server;
  private sessionId(client: Socket) {
    const cookie = client.handshake.headers.cookie;
    if (!cookie) return null;
    // 쿠키 파싱
    const cookieRegex = /connect\.sid=([^;]+)/;
    const match = cookie.match(cookieRegex);
    return match ? match[1] : null;
  }
  // 연결확인
  async handleConnection(client: Socket) {
    try {
      const id = this.sessionId(client);
      // 세션아이디가 없다면
      if (!id) {
        client.disconnect();
        return;
      }
      // 아이디는 있는데 로그인을 안했다면.
      const sessionData = await this.redisService.get(id);
      if (!sessionData || !sessionData.passport.user) {
        client.disconnect();
        return;
      }
      const userId = sessionData.passport.user;
      const userSockets = this.userSocketMap.get(userId) || [];
      // 현재 연결된 소캣 아이디 저장
      userSockets.push(client.id);
      // 업데이트된 소캣 아이디 저장
      this.userSocketMap.set(userId, userSockets);
      client.data.userId = userId;
    } catch (error) {
      console.error('error 연결', error);
      // 연결해제
      client.disconnect();
    }
  }
  // 연결 해제
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const userSockets = this.userSocketMap.get(userId) || [];
      // 끊긴거 빼고 다가져와
      const filterSocket = userSockets.filter((id) => id !== client.id);
      // 연결중인 소캣이없다면
      if (filterSocket.length > 0) {
        this.userSocketMap.set(userId, filterSocket);
      } else {
        this.userSocketMap.delete(userId);
      }
      // 현재 참여중인 채팅방에서 퇴장
      const roomId = this.chatSocketMap.get(client.id);
      if (roomId) {
        this.chatSocketMap.delete(client.id);
        // 퇴장 알림
        client.to(roomId).emit('userleft', { userId });
      }
      console.log(`user ${userId} disconnected: ${client.id}`);
    }
  }
  // 메시지 전송
  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    const userId = client.data.userId;
    if (!userId || !payload.roomId || !payload.content) return;
    try {
      // 접근 권한 확인
      const member = await this.chatMemberRepository.findOne({
        where: { chatRoomId: payload.roomId, userId, isActive: true },
        relations: ['user'],
      });
      if (!member) {
        throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
      }
      // 메시지 저장
      const message: any = {
        chatRoomId: payload.roomId,
        senderId: userId,
        content: payload.content,
        senderName: member.user.name,
        type: payload.type || 'TEXT',
        createdAt: new Date(),
      };
      // 파일 업로드시
      if (payload.fileInfo) {
        message.fileUrl = payload.fileInfo.url;
        message.fileName = payload.fileInfo.filename;
        message.fileSize = payload.fileInfo.size;
      }
      // 몽고디비에 저장
      const newMessage = new this.messageModel(message);
      const savedMessage = await newMessage.save();
      // 메시지 임시저장
      await this.redisService.saveChatMassage(payload.roomId, {
        _id: savedMessage._id,
        senderId: userId,
        senderName: member.user.name,
        content: payload.content,
        type: payload.type || 'TEXT',
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        createdAt: savedMessage.createdAt,
      });
      // 채팅창에 메시지 전송
      this.sendMessageToRoom(payload.roomId, {
        _id: savedMessage._id.toString(),
        senderId: userId,
        senderName: member.user.name,
        content: payload.content,
        type: payload.type || 'TEXT',
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      this.sendMessageToRoom(payload.roomId, {
        senderId: userId,
        content: payload.content,
        timestamp: new Date(),
      });
    }
  }
  sendMessageToRoom(roomId: string, message: any) {
    this.server.to(roomId).emit('newMessage', message);
  }
  // 타이핑 시작시
  @SubscribeMessage('startTyping')
  handleStartTyping(client: Socket, payload: { roomId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload.roomId) return;

    client.to(payload.roomId).emit('userTyping', { userId });
  }
  // 타이핑 멈출시
  @SubscribeMessage('stopTyping')
  handleStopTyping(client: Socket, payload: { roomId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload.roomId) return;

    client.to(payload.roomId).emit('userStoppedTyping', { userId });
  }
  // 채팅방 입장
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload.roomId) return;
    // 혹시 다른방에 있다가 주소창으로 이동시 기존방 나가기
    const prevRoom = this.chatSocketMap.get(client.id);
    if (prevRoom) {
      client.leave(prevRoom);
    }
    // 새 방 입장
    client.join(payload.roomId);
    this.chatSocketMap.set(client.id, payload.roomId);
  }
  // 채팅방 나가기
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket) {
    const roomId = this.chatSocketMap.get(client.id);
    const userId = client.data.userId;
    if (roomId && userId) {
      await this.chatMemberRepository.update(
        { chatRoomId: roomId, userId },
        { isActive: false },
      );
      client.leave(roomId);
      this.chatSocketMap.delete(client.id);
      // 퇴장 알림
      client.to(roomId).emit('userleft', { userId });
      // 업데이트된 참여자 목록 전송
      // const activeMembers = await this.getActiveMembers(roomId);
      // this.server.to(roomId).emit('updatedParticipants', activeMembers);
    }
  }
}

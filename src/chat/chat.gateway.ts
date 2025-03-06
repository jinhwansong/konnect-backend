import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisService) {}
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
    const userId = this.chatSocketMap.get(client.id);
    if (!userId || !payload.roomId || !payload.content) return;
    // 메시지 임시저장
    await this.redisService.saveChatMassage(payload.roomId, {
      ...payload,
      senderId: userId,
      timestamp: new Date(),
    });
    // 채팅창에 메시지 전송
    this.sendMessageToRoom(payload.roomId, {
      ...payload,
      senderId: userId,
      timestamp: new Date(),
    });
  }
  sendMessageToRoom(roomId: string, message: any) {
    this.server.to(roomId).emit('newMessage', message);
  }
  // 타이핑 시작시
  @SubscribeMessage('startTyping')
  handleStartTyping(client: Socket, payload: { roomId: string }) {
    const userId = this.chatSocketMap.get(client.id);
    if (!userId || !payload.roomId) return;

    client.to(payload.roomId).emit('userTyping', { userId });
  }
  // 타이핑 멈출시
  @SubscribeMessage('stopTyping')
  handleStopTyping(client: Socket, payload: { roomId: string }) {
    const userId = this.chatSocketMap.get(client.id);
    if (!userId || !payload.roomId) return;

    client.to(payload.roomId).emit('userStoppedTyping', { userId });
  }
}

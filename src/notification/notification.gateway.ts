import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { NotificationDto } from './dto/notification.request.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'noti',
})
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly redisService: RedisService) {}
  // 같은 아이디로 여러 기기에서 접속시
  private userSocketMap = new Map<number, string[]>();
  @WebSocketServer() public server: Server;
  // 연결확인
  async handleConnection(client: Socket) {
    try {
      const id = this.sessionId(client);
      // 세션아이디가 없다면
      if (!id) {
        console.log('해당 id가 없습니다');
        client.disconnect();
        return;
      }
      // 아이디는 있는데 로그인을 안했다면.
      const sessionData = await this.redisService.get(id);
      if (!sessionData || !sessionData.passport.user) {
        console.log('유효한 세션이 아니거나 사용자 정보가 없습니다.');
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
      console.log(`user ${userId} connected: ${client.id}`);
    } catch (error) {
      console.error('error 연결', error);
      // 연결해제
      client.disconnect();
    }
  }
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
      console.log(`user ${userId} disconnected: ${client.id}`);
    }
  }
  private sessionId(client: Socket) {
    const cookie = client.handshake.headers.cookie;
    if (!cookie) return null;
    // 쿠키 파싱
    const cookieRegex = /connect\.sid=([^;]+)/;
    const match = cookie.match(cookieRegex);
    return match ? match[1] : null;
  }
  // 알림 전송

  sendNotificationToUser(userId: number, noti: NotificationDto) {
    const userSocket = this.userSocketMap.get(userId);
    if (userSocket || userSocket.length > 0) {
      userSocket.forEach((socketId) => {
        this.server.to(socketId).emit('noti', noti);
      });
      console.log(`${userId}에 알림 전송완료`);
    } else {
      console.log(`${userId}에 연결된 소캣없음`);
    }
  }
}

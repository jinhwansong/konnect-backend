import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
    });
  }
  // 세션키 데이터 저장
  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }
  // 세션키 데이터 캐싱
  async get(key: string) {
    const fullKey = key.startsWith('session:') ? key : `session:${key}`;
    const decode = decodeURIComponent(fullKey);
    let processdKey = decode;
    if (decode.includes('.')) {
      processdKey = decode.split('.')[0];
    }
    if (processdKey.includes('s:')) {
      processdKey = processdKey.replace('s:', '');
    }
    const data = await this.client.get(processdKey);
    if (!data) return null;
    return JSON.parse(data);
  }
  // 채팅 메시지 만료시간 설정 및 데이터 저장
  async setEx(key: string, value: any, seconds: number) {
    return await this.client.setex(key, seconds, JSON.stringify(value));
  }
  // 채팅 메시지 저장 및 갯수 제한
  async saveChatMassage(roomId: string, message: any) {
    const key = `chat:${roomId}`;
    await this.client.lpush(key, JSON.stringify(message));
    // 최근 100개 채팅 만 유지
    await this.client.ltrim(key, 0, 99);
  }
  // 메모리 사용량 체크
  async memoryUsage() {
    const info = await this.client.info('memory');
    return info;
  }
  // 특정 데이터 채팅방 1 또는 모든 채팅 특정 유저 데이터 삭제
  async clearPattern(pattern: string) {
    // 패턴과 일치하는 모든키 찾음
    const keys = await this.client.keys(pattern);
    // 찾은 키 있어?
    if (keys.length > 0) {
      // 다 삭제해
      return await this.client.del(...keys);
    }
    return 0;
  }
}

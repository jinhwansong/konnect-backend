import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { LocalSerializer } from './local.serializer';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../entities';
import { KakaoStrategy } from './kakao.strategy';
import { GoogleStrategy } from './google.strategy';
import { NaverStrategy } from './naver.strategy';

@Module({
  imports: [
    // jwt token을 할때는 session이 false다.
    PassportModule.register({ session: true, defaultStrategy: 'local' }),
    TypeOrmModule.forFeature([Users]),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    LocalSerializer,
    KakaoStrategy,
    GoogleStrategy,
    NaverStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  constructor(private readonly authService: AuthService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      // kakao 인증 시도
      const result = (await super.canActivate(context)) as boolean;
      // 인증 성공 시 세션에 저장
      if (result) {
        console.log('인증시도', result);
        console.log('세션에 저장', req);
        await super.logIn(req); // 세션에 저장
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('카카오 인증에 실패했습니다.');
    }
  }
  // 카카오 로그인으로 리다이렉션
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      throw new UnauthorizedException('카카오 인증 중 오류가 발생했습니다.');
    }
    if (!user) {
      throw new UnauthorizedException(
        '카카오 사용자 정보를 가져오는데 실패했습니다.',
      );
    }

    return user;
  }
}

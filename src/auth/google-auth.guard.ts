import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly authService: AuthService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    try {
      // 구글 인증 시도
      const result = await super.canActivate(context);
      // 인증 성공 시 세션에 저장
      if (result) {
        await super.logIn(req); // 세션에 저장
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('구글 인증에 실패했습니다.');
    }
  }
  // 구글 로그인으로 리다이렉션
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      throw new UnauthorizedException('구글 인증 중 오류가 발생했습니다.');
    }
    if (!user) {
      throw new UnauthorizedException(
        '구글 사용자 정보를 가져오는데 실패했습니다.',
      );
    }

    return user;
  }
}

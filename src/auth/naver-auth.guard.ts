import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class NaverAuthGuard extends AuthGuard('naver') {
  constructor(private authService: AuthService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    try {
      // naver 인증 시도
      const result = (await super.canActivate(context)) as boolean;
      // 인증 성공 시 세션에 저장
      if (result) {
        await super.logIn(req); // 세션에 저장
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('네이버 인증에 실패했습니다.');
    }
  }
  // 네이버 로그인으로 리다이렉션
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err) {
      throw new UnauthorizedException('네이버 인증 중 오류가 발생했습니다.');
    }
    if (!user) {
      throw new UnauthorizedException(
        '네이버 사용자 정보를 가져오는데 실패했습니다.',
      );
    }

    return user;
  }
}

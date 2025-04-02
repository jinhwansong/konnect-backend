import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const can = await super.canActivate(context);
      if (can) {
        const request = context.switchToHttp().getRequest();

        // 로그인 실행
        await super.logIn(request);

        // 세션 쿠키 설정 (간단 버전)
        if (request.session && process.env.NODE_ENV === 'production') {
          request.session.cookie.domain = '.konee.shop';
          request.session.cookie.secure = true;
          request.session.cookie.sameSite = 'none';
        }
      }
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '인증 처리 중 오류가 발생했습니다.',
      );
    }
  }
}

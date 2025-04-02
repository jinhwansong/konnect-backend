import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from 'node_modules/@nestjs/config';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const can = await super.canActivate(context);
      if (can) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // 로그인 실행
        await super.logIn(request);

        // 기존 쿠키 값 획득
        const sessionCookie = request.cookies['connect.sid'];
        if (sessionCookie) {
          // 기존 쿠키를 제거
          response.clearCookie('connect.sid');

          // 새 쿠키 설정 (명시적으로 모든 옵션 지정)
          const isProd = this.configService.get('NODE_ENV') === 'production';
          response.cookie('connect.sid', sessionCookie, {
            domain: isProd ? '.konee.shop' : 'localhost',
            path: '/',
            httpOnly: true,
            secure: isProd,
            maxAge: 3600000,
            sameSite: isProd ? 'none' : 'lax',
          });
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

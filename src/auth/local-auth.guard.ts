import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly authService: AuthService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const can = await super.canActivate(context);
      if (can) {
        const request = context.switchToHttp().getRequest();
        // request.session.cookie.domain = '.konee.shop';
        await super.logIn(request);
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

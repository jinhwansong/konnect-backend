import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-naver-v2';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SocialLoginProvider } from 'src/common/enum/status.enum';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: '/users/auth/naver/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: CallableFunction,
  ) {
    const { _json } = profile;
    const naverUser = {
      snsId: _json.response.email,
      nickname: _json.response.nickname,
      name: _json.response.name,
      image: _json.response.profile_image,
      phone: _json.response.mobile.replace(/-/g, ''),
      socialLoginProvider: SocialLoginProvider.NAVER,
    };
    // db에 저장
    const res = await this.authService.snsUser(naverUser);
    return done(null, res);
  }
}

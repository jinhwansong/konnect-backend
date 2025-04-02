import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-kakao';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SocialLoginProvider } from '@/common/enum/status.enum';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === 'production'
          ? `${process.env.CALLBACK_URL}/users/auth/kakao/callback`
          : '/users/auth/kakao/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: CallableFunction,
  ) {
    const { id, username, _json } = profile;
    const kakaoAccount = _json.kakao_account;
    const properties = _json.properties;
    const phone = kakaoAccount.phone_number;
    const kakaoUser = {
      snsId: kakaoAccount.email,
      nickname: properties.nickname,
      name: username,
      image: properties.profile_image,
      phone: '0' + phone.replace(/^\+82\s*|-/g, ''),
      socialLoginProvider: SocialLoginProvider.KAKAO,
    };
    // db에 저장
    const res = await this.authService.snsUser(kakaoUser);
    return done(null, res);
  }
}

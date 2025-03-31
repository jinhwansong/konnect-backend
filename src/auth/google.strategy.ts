import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SocialLoginProvider } from '../common/enum/status.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/users/auth/google/callback`,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: CallableFunction,
  ) {
    const { _json, photos } = profile;
    const googleUser = {
      snsId: _json.email,
      nickname: _json.name,
      name: _json.name,
      image: photos[0].value,
      phone: '01032633143',
      socialLoginProvider: SocialLoginProvider.GOOGLE,
    };
    // db에 저장
    const res = await this.authService.snsUser(googleUser);
    return done(null, res);
  }
}

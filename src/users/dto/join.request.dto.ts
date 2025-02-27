import { PickType } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { Users } from 'src/entities/Users';

export class JoinRequestDto extends PickType(Users, [
  'email',
  'name',
  'nickname',
  'phone',
]) {
  @IsString()
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    {
      message:
        '비밀번호는 8자 이상이며, 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.',
    },
  )
  password: string;
}
export class SnsJoinRequestDto extends PickType(Users, [
  'snsId',
  'name',
  'nickname',
  'phone',
  'image',
  'socialLoginProvider',
]) {}

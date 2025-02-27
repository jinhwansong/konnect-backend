import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Users } from 'src/entities/Users';

export class UpdatePasswordDto {
  @ApiProperty({
    example: '123456Q!',
    description: '비밀번호',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    {
      message: '8자이상 영문 숫자 특수문자 포함이어야 합니다.',
    },
  )
  currentPassword: string;

  @ApiProperty({
    example: '123456Q!',
    description: '비밀번호',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
    {
      message: '새 비밀번호는 8자이상 영문 숫자 특수문자 포함이어야 합니다.',
    },
  )
  newPassword: string;
}
export class UpdateNicknameDto extends PickType(Users, ['nickname']) {
  @Matches(/^[가-힣a-zA-Z]{2,7}$/, {
    message: '2글자 이상 7글자 이하로 작성해주세요',
  })
  nickname: string;
}
export class UpdateImageDto extends PickType(Users, ['image']) {}
export class UpdatePhoneDto extends PickType(Users, ['phone']) {}
export class UpdateEmailDto extends PickType(Users, ['email']) {
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: '이메일 형식이 올바르지 않습니다.',
  })
  email: string;
}

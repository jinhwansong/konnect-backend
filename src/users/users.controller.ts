import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDtoByPassword } from 'src/common/dto/user.dto';
import { JoinRequestDto } from './dto/join.request.dto';
import {
  UpdateEmailDto,
  UpdateImageDto,
  UpdateNicknameDto,
  UpdatePasswordDto,
  UpdatePhoneDto,
} from './dto/update.requset.dto';
import { User } from 'src/common/decorators/user.decorator';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { NotLoggedInGuard } from 'src/auth/not-logged-in.guard';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { KakaoAuthGuard } from 'src/auth/kakao-auth.guard';
import { Response } from 'express';
import { NaverAuthGuard } from 'src/auth/naver-auth.guard';
import { GoogleAuthGuard } from 'src/auth/google-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerImage } from 'src/common/utils/multer.options';
import { RedisService } from 'src/redis/redis.service';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('유저정보')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  @ApiResponse({
    status: 200,
    description: '사용자 정보 입니다',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 500,
    description: '서버 에러',
  })
  @ApiOperation({ summary: '내정보 조회' })
  @Get()
  getUser(@User() user) {
    if (!user) {
      return null; // 비로그인 상태에서 호출된 경우
    }
    const { id, ...userWithoutId } = user; // 필요한 필드만 선택
    return userWithoutId;
  }
  @ApiResponse({
    status: 200,
    description: '회원가입이 완료되셨습니다.',
    type: JoinRequestDto,
  })
  @ApiResponse({
    status: 500,
    description: '서버 에러',
  })
  @UseGuards(new NotLoggedInGuard())
  @ApiOperation({ summary: '회원가입' })
  @Post()
  Join(@Body() body: JoinRequestDto) {
    return this.userService.Join(body);
  }
  @ApiResponse({
    status: 200,
    description: '사용 가능한 이메일 입니다.',
    type: UpdateEmailDto,
  })
  @ApiResponse({
    status: 400,
    description: '중복된 이메일이 존재합니다.',
  })
  @ApiOperation({ summary: '이메일 중복검사' })
  @Post('checkEmail')
  async checkEmail(@Body() body: UpdateEmailDto) {
    return this.userService.checkEmail(body.email);
  }
  @ApiResponse({
    status: 201,
    description: '사용가능한 닉네임입니다.',
    type: UpdateNicknameDto,
  })
  @ApiResponse({
    status: 400,
    description: '이미 사용 중인 닉네임입니다.',
  })
  @ApiOperation({ summary: '닉네임 중복검사' })
  @Post('checkNickname')
  checkNickname(@Body() body: UpdateNicknameDto) {
    return this.userService.checkNickname(body.nickname);
  }
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 500,
    description: '서버에러',
  })
  @ApiOperation({ summary: '로그인' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  logIn(@User() user) {
    return user;
  }
  @ApiResponse({
    status: 200,
    description: '카카오 로그인을 성공했습니다.',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 500,
    description: '서버에러',
  })
  @ApiOperation({ summary: '카카오로그인' })
  @UseGuards(KakaoAuthGuard)
  @Get('auth/kakao')
  kakaoLogin() {
    return;
  }
  @UseGuards(KakaoAuthGuard)
  @Get('auth/kakao/callback')
  async kakaoCallback(@Res() res: Response) {
    return res.redirect(`${process.env.CLIENT}`);
  }
  @ApiResponse({
    status: 200,
    description: '구글 로그인을 성공했습니다.',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 500,
    description: '서버에러',
  })
  @ApiOperation({ summary: '구글 로그인' })
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google')
  googleLogin() {
    return;
  }
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/callback')
  async googleCallback(@Res() res: Response) {
    return res.redirect(`${process.env.CLIENT}`);
  }
  @ApiResponse({
    status: 200,
    description: '네이버 로그인을 성공했습니다.',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 500,
    description: '서버에러',
  })
  @ApiOperation({ summary: '네이버 로그인' })
  @UseGuards(NaverAuthGuard)
  @Get('auth/naver')
  naverLogin() {
    return;
  }
  @UseGuards(NaverAuthGuard)
  @Get('auth/naver/callback')
  async naverCallback(@Res() res: Response) {
    return res.redirect(`${process.env.CLIENT}`);
  }
  @ApiResponse({
    status: 201,
    description: '로그아웃 하셨습니다.',
  })
  @ApiResponse({
    status: 500,
    description: '서버에러',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  logOut(@Req() req, @Res() res) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: '로그아웃 실패했습니다' });
      }
      req.session.destroy((err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: '세션키 삭제를 실패했습니다' });
        }
        this.redisService.clearPattern(`session:${req.sessionID}`);
        res.clearCookie('connect.sid', {
          httpOnly: true,
          path: '/',
          secure: false,
        });
        return res.status(200).send('로그아웃 하셨습니다');
      });
    });
  }
  @ApiResponse({
    status: 200,
    description: '닉네임이 변경되었습니다.',
    type: UpdateNicknameDto,
  })
  @ApiResponse({
    status: 400,
    description: '이미 존재하는 닉네임입니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '닉네임 변경' })
  @Patch('nickname')
  nickname(@Body() body: UpdateNicknameDto, @User() user) {
    return this.userService.updateNickname(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '비밀번호가 변경되었습니다.',
    type: UpdatePasswordDto,
  })
  @ApiResponse({
    status: 400,
    description: '현재 비밀번호가 일치하지 않습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '비밀번호 변경' })
  @Patch('password')
  password(@Body() body: UpdatePasswordDto, @User() user) {
    return this.userService.updatePassword(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '휴대폰번호가 변경되었습니다.',
    type: UpdatePhoneDto,
  })
  @ApiResponse({
    status: 400,
    description: '이미 존재하는 휴대폰 번호입니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '휴대폰번호 변경' })
  @Patch('phone')
  phone(@Body() body: UpdatePhoneDto, @User() user) {
    return this.userService.updatePhone(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '프로필이미지가 변경되었습니다.',
    type: UpdateImageDto,
  })
  @ApiResponse({
    status: 400,
    description: '지원하지 않는 이미지 형식입니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '프로필이미지 변경' })
  @UseInterceptors(FileInterceptor('image', multerImage()))
  @Patch('profile')
  profile(@UploadedFile() file: Express.Multer.File, @User() user) {
    return this.userService.updateProfile(file, user.id);
  }
}

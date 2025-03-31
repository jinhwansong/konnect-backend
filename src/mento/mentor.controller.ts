import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { MentorService } from './mentor.service';
import { User } from 'src/common/decorators/user.decorator';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import {
  MentorProfileDto,
  UpdateCareerDto,
  UpdateCompanyDto,
  UpdateImageDto,
  UpdateIntroduceDto,
  UpdatePositionDto,
} from './dto/update.profile.dto';
import { MentorRequestDto } from './dto/mentor.request.dto';
import { multerImage } from 'src/common/utils/multer.options';
import { WebpTransformInterceptor } from 'src/common/interceptors/webpTransform.Interceptor';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('멘토')
@Controller('mentor')
export class MentorController {
  constructor(private readonly MentorService: MentorService) {}
  @ApiResponse({
    status: 201,
    description: '멘토신청이 완료되었습니다.',
    type: MentorRequestDto,
  })
  @ApiResponse({
    status: 400,
    description: '이미 멘토신청을 완료했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '이미 멘토신청을 완료했습니다.' },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 신청' })
  @Post()
  async MentorApplication(@Body() body: MentorRequestDto, @User() user) {
    return await this.MentorService.mentorApplication(body, user.id);
  }
  @ApiResponse({
    status: 201,
    description: '멘토 프로필정보입니다.',
    type: MentorProfileDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 정보를 찾던 도중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로필정보' })
  @Get()
  async getMentor(@User() user) {
    return await this.MentorService.getMentor(user.id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 연차가 변경되었습니다.',
    type: UpdateCareerDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 연차 변경 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '멘토님의 연차 변경 중 오류가 발생했습니다..',
        },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 연차 변경' })
  @Patch('career')
  career(@Body() body: UpdateCareerDto, @User() user) {
    return this.MentorService.updateCareer(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '프로필이미지가 변경되었습니다.',
    type: UpdateImageDto,
  })
  @ApiResponse({
    status: 500,
    description: '파일 업로드 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '프로필이미지 변경' })
  @UseInterceptors(
    FileInterceptor('image', multerImage()),
    WebpTransformInterceptor,
  )
  @Patch('profile')
  profile(@UploadedFile() file: Express.Multer.File, @User() user) {
    return this.MentorService.updateProfile(file, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 회사명이 변경되었습니다.',
    type: UpdateCompanyDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 회사명을 변경 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '멘토님의 회사명을 변경 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 회사명 변경' })
  @Patch('company')
  company(@Body() body: UpdateCompanyDto, @User() user) {
    return this.MentorService.updateCompany(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 자기소개가 변경되었습니다.',
    type: UpdateIntroduceDto,
  })
  @ApiResponse({
    status: 400,
    description: '입력한 자기소개 내용이 잘못되었습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '자기소개는 최대 5000자 이내여야 합니다.',
        },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 자기소개 변경' })
  @Patch('introduce')
  introduce(@Body() body: UpdateIntroduceDto, @User() user) {
    return this.MentorService.updateIntroduce(body, user.id);
  }
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: '프로필이미지가 변경되었습니다.',
    type: UpdateImageDto,
  })
  @ApiResponse({
    status: 400,
    description: '지원하지 않는 이미지 형식입니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '지원하지 않는 이미지 형식입니다.',
        },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '이미지 변경' })
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('images[]', 10, multerImage()),
    WebpTransformInterceptor,
  )
  uploadImage(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @User() user,
  ) {
    return this.MentorService.uploadImage(files, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 전문분야가 변경되었습니다.',
    type: UpdatePositionDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 전문분야를 변경 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '멘토님의 전문분야를 변경 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 전문분야 변경' })
  @Patch('position')
  position(@Body() body: UpdatePositionDto, @User() user) {
    return this.MentorService.updatePosition(body, user.id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import {
  MentorApprovalDto,
  MentorRequestDto,
} from 'src/mento/dto/mentor.request.dto';
import { PaginationDto } from 'src/common/dto/page.dto';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { AdminService } from './admin.service';
import { UserDtoByPassword } from 'src/common/dto/user.dto';
import { UserRole } from '../common/enum/status.enum';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('관리자')
@Controller('admin')
export class AdminController {
  constructor(private readonly AdminService: AdminService) {}
  @ApiResponse({
    status: 201,
    description: '멘토 승인이 완료되었습니다.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: '멘토 승인이 완료되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '멘토 승인 처리 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '멘토 승인 처리 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @UseGuards(new LoggedInGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '멘토 승인/거절' })
  @Post('approve/:id')
  async approveMentor(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MentorApprovalDto,
  ) {
    return await this.AdminService.approveMentor(
      id,
      body.approved,
      body.reason,
    );
  }
  @ApiResponse({
    status: 201,
    description: '멘토 신청 목록 조회 성공',
    type: MentorRequestDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토 신청 목록 조회 실패',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '멘토 신청 목록 조회 실패',
        },
      },
    },
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @UseGuards(new LoggedInGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '멘토 신청 목록 조회' })
  @Get('applications')
  async getApplications(@Query() paginationDto: PaginationDto) {
    return await this.AdminService.getApplications(paginationDto);
  }

  @ApiResponse({
    status: 201,
    description: '멘토 신청 상세 조회 성공',
    type: MentorRequestDto,
  })
  @ApiResponse({
    status: 404,
    description: '멘토 신청 정보를 찾을 수 없습니다.',
  })
  @UseGuards(new LoggedInGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '멘토 신청 상세 조회' })
  @Get('applications/:id')
  async getApplicationsDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.AdminService.findOneApplicationDetail(id);
  }
  @ApiResponse({
    status: 201,
    description: '사용자 목록 조회 성공',
    type: UserDtoByPassword,
  })
  @ApiResponse({
    status: 404,
    description: '사용자 목록 를 찾을 수 없습니다.',
  })
  @UseGuards(new LoggedInGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '사용자 목록 조회' })
  @Get('users')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async user(@Query() paginationDto: PaginationDto) {
    return await this.AdminService.findAllUser(paginationDto);
  }
}

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { ProgramsService } from './programs.service';
import {
  ProgramRequestDto,
  UserListDto,
  UserProgramDetails,
} from './dto/program.request';
import { LoggedInGuard } from 'src/auth/logged-in.guard';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('유저 프로그램')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly ProgramService: ProgramsService) {}
  @ApiResponse({
    status: 200,
    description: '모든 프로그램을 불러옵니다.',
    type: UserListDto,
  })
  @ApiOperation({ summary: '프로그램 불러오기' })
  @Get('')
  get(@Query() query: ProgramRequestDto) {
    return this.ProgramService.get(query);
  }
  @ApiResponse({
    status: 200,
    description: '해당 프로그램을 불러옵니다.',
    type: UserProgramDetails,
  })
  @ApiResponse({
    status: 500,
    description: '프로그램 조회 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '프로그램 조회 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @ApiOperation({ summary: '프로그램 불러오기' })
  @Get(':id')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.ProgramService.getDetail(id);
  }
  @ApiResponse({
    status: 200,
    description: '가능한 시간 조회',
  })
  @ApiResponse({
    status: 500,
    description: '시간 조회 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '시간 조회 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @ApiOperation({ summary: '가능한 날짜 조회' })
  @UseGuards(new LoggedInGuard())
  @Get(':id/month')
  getAvailableDates(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.ProgramService.getAvailableDates(id, year, month);
  }

  @ApiResponse({
    status: 200,
    description: '가능한 시간 조회',
  })
  @ApiResponse({
    status: 500,
    description: '시간 조회 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '시간 조회 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @ApiOperation({ summary: '가능한 시간 조회' })
  @UseGuards(new LoggedInGuard())
  @Get(':id/times')
  getTimeSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('day') day: number,
  ) {
    return this.ProgramService.getTimeSlots(id, year, month, day);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AskApprovDto,
  AskDto,
  MentoingProgramCreateDto,
  MentoingProgramDto,
  ProgramListDto,
  ScheduleListDto,
} from 'src/mentoring/dto/program.request.dto';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { User } from 'src/common/decorators/user.decorator';
import { PaginationDto } from 'src/common/dto/page.dto';
import { SearchDto } from 'src/common/dto/search.dto';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { MentoringService } from './mentoring.service';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('멘토링')
@Controller('mentoring')
export class MentoringController {
  constructor(private readonly MentoringService: MentoringService) {}

  @ApiResponse({
    status: 200,
    description: '신청된 프로그램이 조회되었습니다.',
    type: ScheduleListDto,
  })
  @ApiResponse({
    status: 500,
    description: '신청된 프로그램이 조회 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토링 관리 조회' })
  @Get('schedule')
  getSchedule(@User() user, @Query() query: PaginationDto) {
    return this.MentoringService.getSchedule(user.id, query);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램을 검색 하였습니다.',
    type: ProgramListDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램을 검색 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 검색' })
  @Get('search')
  search(@User() user, @Query() searchDto: SearchDto) {
    return this.MentoringService.search(user.id, searchDto);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램이 등록되었습니다.',
    type: MentoingProgramDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램 등록 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램등록' })
  @Post('')
  create(@Body() body: MentoingProgramCreateDto, @User() user) {
    return this.MentoringService.create(body, user.id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램이 수정되었습니다.',
    type: MentoingProgramDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램 수정 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 수정' })
  @Patch(':id')
  update(
    @Body() body: MentoingProgramCreateDto,
    @User() user,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.MentoringService.update(body, user.id, id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램이 삭제되었습니다.',
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램 삭제 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 삭제' })
  @Delete(':id')
  deleteProgram(@User() user, @Param('id', ParseIntPipe) id: number) {
    return this.MentoringService.delete(user.id, id);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램이 조회되었습니다.',
    type: ProgramListDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램 조회 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 조회' })
  @Get('')
  get(@User() user, @Query() query: PaginationDto) {
    return this.MentoringService.get(user.id, query);
  }
  @ApiResponse({
    status: 200,
    description: '멘토님의 프로그램이 조회되었습니다.',
    type: ProgramListDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토님의 프로그램 조회 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 상세조회' })
  @Get(':id')
  detail(@User() user, @Param('id', ParseIntPipe) id: number) {
    return this.MentoringService.detail(user.id, id);
  }
  @ApiResponse({
    status: 200,
    description: '신청된 프로그램이 조회되었습니다.',
    type: AskDto,
  })
  @ApiResponse({
    status: 500,
    description: '신청된 프로그램이 조회 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '멘토 프로그램 상세조회' })
  @Get('schedule/:id')
  detailSchedule(@User() user, @Param('id', ParseIntPipe) id: number) {
    return this.MentoringService.detailSchedule(user.id, id);
  }
  @ApiResponse({
    status: 200,
    description: '신청된 프로그램을 승인하셨습니다.',
  })
  @ApiResponse({
    status: 500,
    description: '프로그램을 승인 처리 중 오류가 발생했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '예약 승인/거절' })
  @Post('schedule/:id')
  approve(
    @User() user,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AskApprovDto,
  ) {
    return this.MentoringService.approve(
      user.id,
      id,
      body.approved,
      body.reason,
    );
  }
}

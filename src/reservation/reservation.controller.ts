import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import {
  CreateReservationDto,
  PaymentVerificationDto,
  ReservationListDto,
} from './dto/create-reservation.dto';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { User } from 'src/common/decorators/user.decorator';
import { PaginationDto } from 'src/common/dto/page.dto';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('프로그램 예약/조회')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '프로그램 예약' })
  @ApiResponse({
    status: 200,
    description: '프로그램이 예약완료 되었습니다.',
    type: CreateReservationDto,
  })
  @ApiResponse({
    status: 500,
    description: '프로그램 예약 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '프로그램 예약 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @Post()
  create(@Body() body: CreateReservationDto, @User() user) {
    return this.reservationService.create(body, user.id);
  }
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '프로그램 예약 결제검증' })
  @ApiResponse({
    status: 200,
    description: '프로그램이 예약 결제 검증이 완료 되었습니다.',
    type: PaymentVerificationDto,
  })
  @ApiResponse({
    status: 500,
    description: '프로그램 예약 결제 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '프로그램 예약 결제 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @Post('verify')
  verifyPayment(@Body() PaymentVerificationDto: PaymentVerificationDto) {
    return this.reservationService.verifyPayment(PaymentVerificationDto);
  }
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '멘토링 신청 목록' })
  @ApiResponse({
    status: 200,
    description: '멘토링 신청 목록 조회 완료 되었습니다.',
    type: ReservationListDto,
  })
  @ApiResponse({
    status: 500,
    description: '멘토링 신청 목록을 불러오던 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '결제 목록 조회 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @Get('')
  getMentoringList(@User() user, @Query() query: PaginationDto) {
    return this.reservationService.getMentoringList(user.id, query);
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { PaymentsService } from './payments.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { User } from 'src/common/decorators/user.decorator';
import { PaginationDto } from 'src/common/dto/page.dto';
import { PaymentsListDto, RefundPaymentsDto } from './dto/payments.request';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('결제목록')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly PaymentService: PaymentsService) {}
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '프로그램 결제 목록' })
  @ApiResponse({
    status: 200,
    description: '결제 목록 조회 완료 되었습니다.',
    type: PaymentsListDto,
  })
  @ApiResponse({
    status: 500,
    description: '결제 목록 조회 중 오류가 발생했습니다.',
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
  get(@User() user, @Query() query: PaginationDto) {
    return this.PaymentService.get(user.id, query);
  }
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '프로그램 결제 환불' })
  @ApiResponse({
    status: 200,
    description: '환불 및 예약이 취소되었습니다',
  })
  @ApiResponse({
    status: 500,
    description: '환불 처리 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '환불 처리 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @Post('cancel')
  getCancel(@User() user, @Body() body: RefundPaymentsDto) {
    return this.PaymentService.getCancel(user.id, body.paymentKey);
  }
}

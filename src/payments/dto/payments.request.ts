import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/page.dto';
import { Payments } from 'src/entities/Payments';
import { Users } from 'src/entities/Users';

// 구매 내역
export class PaymentDto extends IntersectionType(
  PickType(Payments, [
    'title',
    'id',
    'price',
    'paidAt',
    'status',
    'paymentKey',
    'createdAt',
  ]),
  PickType(Users, ['name']),
) {}
export class PaymentsListDto extends PaginationDto {
  @ApiProperty({ type: [PaymentDto] })
  items: PaymentDto[];
}

export class RefundPaymentsDto extends PickType(Payments, ['paymentKey']) {}

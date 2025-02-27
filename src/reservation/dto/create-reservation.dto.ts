import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/page.dto';
import { Contact } from 'src/entities/Contact';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { Payments } from 'src/entities/Payments';
import { Reservations } from 'src/entities/Reservations';
import { Users } from 'src/entities/Users';

export class CreateReservationDto extends IntersectionType(
  PickType(Reservations, ['startTime', 'endTime', 'programsId']),
  PickType(Contact, ['phone', 'email', 'message']),
) {}

export class PaymentVerificationDto extends IntersectionType(
  PickType(Payments, ['paymentKey', 'orderId', 'price', 'receiptUrl']),
) {}

// 프로그램 예약내역
export class MentoringListDto extends IntersectionType(
  PickType(Reservations, ['createdAt', 'id', 'startTime', 'endTime', 'status']),
  PickType(MentoringPrograms, ['duration', 'title']),
  PickType(Users, ['name']),
) {}
export class ReservationListDto extends PaginationDto {
  @ApiProperty({ type: [MentoringListDto] })
  items: MentoringListDto[];
}

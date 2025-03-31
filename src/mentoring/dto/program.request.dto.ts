import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/common/dto/page.dto';
import { AvailableSchedule } from 'src/entities/AvailableSchedule';
import { Contact } from 'src/entities/Contact';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { Reservations } from 'src/entities/Reservations';
import { Review } from 'src/entities/Review';
import { Users } from 'src/entities/Users';

// 프로그램 생성
export class MentoingProgramCreateDto extends IntersectionType(
  PickType(MentoringPrograms, [
    'title',
    'content',
    'price',
    'duration',
    'mentoring_field',
  ]),
  PickType(AvailableSchedule, ['available_schedule']),
) {}
// 프로그램 수정 조회
export class MentoingProgramDto extends IntersectionType(
  PickType(MentoringPrograms, [
    'title',
    'content',
    'price',
    'duration',
    'status',
  ]),
  PickType(AvailableSchedule, ['available_schedule']),
  PickType(Review, ['rating']),
) {}

export class ProgramListDto extends PaginationDto {
  @ApiProperty({ type: [MentoingProgramDto] })
  items: MentoingProgramDto[];
}

// 멘토링 관리 조회
export class AskListDto extends IntersectionType(
  PickType(Reservations, ['createdAt', 'id', 'startTime']),
  PickType(MentoringPrograms, ['title']),
  PickType(Users, ['name']),
  PickType(Contact, ['phone', 'email']),
) {}
// 멘토링 관리 조회
export class AskDto extends IntersectionType(
  PickType(Reservations, ['createdAt', 'id', 'startTime']),
  PickType(MentoringPrograms, ['title']),
  PickType(Users, ['name']),
  PickType(Contact, ['phone', 'email', 'message']),
) {}
export class ScheduleListDto extends PaginationDto {
  @ApiProperty({ type: [AskListDto] })
  items: AskListDto[];
}
// 멘토링 승인/거절
export class AskApprovDto extends PickType(Reservations, ['reason']) {
  @ApiProperty({
    example: true,
    description: '승인 여부',
  })
  @IsBoolean()
  approved: boolean;
}

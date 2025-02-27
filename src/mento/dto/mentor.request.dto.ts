import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Mentors } from 'src/entities/Mentors';

export class MentorRequestDto extends PickType(Mentors, [
  'email',
  'job',
  'introduce',
  'portfolio',
  'career',
]) {}
// 멘토 승인/거절 DTO
export class MentorApprovalDto extends PickType(Mentors, ['reason']) {
  @ApiProperty({
    example: true,
    description: '승인 여부',
  })
  @IsBoolean()
  approved: boolean;
}

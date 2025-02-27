import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/page.dto';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { MentorProfile } from 'src/entities/MentorProfile';
import { Mentors } from 'src/entities/Mentors';
import { Review } from 'src/entities/Review';
import { Users } from 'src/entities/Users';

export class UserProgram extends IntersectionType(
  PickType(MentorProfile, ['company', 'position', 'image']),
  PickType(Users, ['name']),
  PickType(Mentors, ['career']),
  PickType(Review, ['rating']),
  PickType(MentoringPrograms, ['title', 'mentoring_field', 'id']),
) {}
export class UserProgramDetails extends IntersectionType(
  PickType(MentorProfile, ['company', 'position', 'image']),
  PickType(Users, ['name']),
  PickType(Mentors, ['career']),
  PickType(Review, ['rating']),
  PickType(MentoringPrograms, [
    'title',
    'mentoring_field',
    'id',
    'content',
    'price',
    'duration',
  ]),
) {}
export class UserListDto extends PaginationDto {
  @ApiProperty({ type: [UserProgram] })
  items: UserProgram[];
}
export enum SortType {
  RECENT = 'latest',
  POPULAR = 'popular',
}
export class ProgramRequestDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SortType)
  @ApiProperty({
    description: '정렬기준 (최신순/인기순)',
    required: false,
    enum: SortType,
    default: SortType.RECENT,
  })
  sort?: string = SortType.RECENT;
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '멘토링 분야',
    required: false,
    example: 'IT개발/데이터',
  })
  mentoring_field?: string;
}

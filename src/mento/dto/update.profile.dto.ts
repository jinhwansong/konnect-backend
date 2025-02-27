import { IntersectionType, PickType } from '@nestjs/swagger';
import { MentorProfile } from 'src/entities/MentorProfile';
import { Mentors } from 'src/entities/Mentors';

export class UpdateCareerDto extends PickType(Mentors, ['career']) {}
export class UpdatePositionDto extends PickType(MentorProfile, ['position']) {}
export class UpdateImageDto extends PickType(MentorProfile, ['image']) {}
export class UpdateCompanyDto extends PickType(MentorProfile, ['company']) {}
export class UpdateIntroduceDto extends PickType(MentorProfile, [
  'introduce',
]) {}
export class MentorProfileDto extends IntersectionType(
  PickType(Mentors, ['job', 'career']),
  PickType(MentorProfile, ['introduce', 'company', 'image']),
) {}

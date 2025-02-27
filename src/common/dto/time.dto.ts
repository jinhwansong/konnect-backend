import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class TimeDto {
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  startTime: string;
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;
}
export class weeklyScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  monday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  tuesday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  wednesday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  thursday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  friday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  saturday: TimeDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeDto)
  sunday: TimeDto[];
}

// 멘토링 예외일정
enum Exceptions {
  // 공휴일/휴일 관련
  HOLIDAY = 'holiday',
  // 개인 사유
  VACATION = 'VACATION', // 휴가
  SICK_LEAVE = 'SICK_LEAVE', // 병가
  PERSONAL = 'PERSONAL', // 개인 일정
}

export class ExceptionDateDto {
  @IsDateString()
  @ApiProperty({
    example: '2024-02-14',
    description: '불가능한 날짜',
  })
  date: string;
  @IsDateString()
  @ApiProperty({
    example: Exceptions.HOLIDAY,
    enum: Exceptions,
    description: '예외사유',
  })
  type: Exceptions;
}

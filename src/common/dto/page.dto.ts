import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

// 페이지네이션 DTO
export class PaginationDto {
  @ApiProperty({ description: '페이지 번호', example: 1, default: 1 })
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', example: 10, default: 10 })
  limit?: number = 10;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './page.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '검색어' })
  keyword?: string;
  @IsOptional()
  @IsEnum(['price', 'title', 'latest'])
  @ApiProperty({ description: '정렬 기준', default: 'latest' })
  sort?: string = 'latest';
}

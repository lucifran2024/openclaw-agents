import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityQueryDto {
  @ApiPropertyOptional({ description: 'Resource ID to check availability for' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({ description: 'Service type ID (needed for slot duration)' })
  @IsString()
  @IsNotEmpty()
  serviceTypeId!: string;

  @ApiProperty({ description: 'Date to check (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Unit ID to filter resources' })
  @IsString()
  @IsOptional()
  unitId?: string;
}

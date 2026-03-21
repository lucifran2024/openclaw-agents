import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceTypeDto {
  @ApiProperty({ description: 'Service type name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional({ description: 'Price for this service' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Color hex code for calendar display' })
  @IsString()
  @IsOptional()
  color?: string;
}

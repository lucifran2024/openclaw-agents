import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '../entities/resource.entity';

export class CreateResourceDto {
  @ApiProperty({ description: 'Resource name (e.g. "Dr. Silva", "Sala 3")' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Resource type', enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiPropertyOptional({ description: 'Linked system user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Service type IDs this resource provides', type: [String] })
  @IsArray()
  @IsOptional()
  serviceTypeIds?: string[];
}

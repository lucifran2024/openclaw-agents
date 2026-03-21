import { IsString, IsOptional, IsEnum, IsDateString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType } from '../entities/campaign.entity';

export class CampaignSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetCount?: number;

  @ApiProperty()
  @IsString()
  phoneNumberId!: string;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  templateId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ type: CampaignSettingsDto })
  @ValidateNested()
  @Type(() => CampaignSettingsDto)
  settings!: CampaignSettingsDto;
}

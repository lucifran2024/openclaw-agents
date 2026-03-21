import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerType } from '../entities/bot-flow.entity';

export class CreateFlowDto {
  @ApiProperty({ description: 'Flow name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Flow description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TriggerType, description: 'Trigger type' })
  @IsEnum(TriggerType)
  triggerType!: TriggerType;

  @ApiPropertyOptional({ description: 'Trigger configuration' })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>;
}

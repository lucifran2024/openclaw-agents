import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerType } from '../entities/bot-flow.entity';

export class UpdateFlowDto {
  @ApiPropertyOptional({ description: 'Flow name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Flow description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TriggerType, description: 'Trigger type' })
  @IsEnum(TriggerType)
  @IsOptional()
  triggerType?: TriggerType;

  @ApiPropertyOptional({ description: 'Trigger configuration' })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>;
}

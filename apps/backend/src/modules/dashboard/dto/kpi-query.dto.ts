import {
  IsArray,
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PeriodType } from '../entities/materialized-kpi.entity';

export class KpiQueryDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  metrics!: string[];

  @IsEnum(PeriodType)
  periodType!: PeriodType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  channel?: string;
}

import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WidgetItemDto {
  @IsString()
  widgetId!: string;

  @IsString()
  type!: string;

  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  w!: number;

  @IsNumber()
  h!: number;

  @IsOptional()
  config?: Record<string, any>;
}

export class SaveLayoutDto {
  @IsOptional()
  @IsString()
  layoutName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetItemDto)
  widgets!: WidgetItemDto[];
}

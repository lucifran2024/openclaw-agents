import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardType } from '../entities/board.entity';

export class CreateBoardDto {
  @ApiProperty({ description: 'Board name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ enum: BoardType, default: BoardType.CUSTOM })
  @IsEnum(BoardType)
  @IsOptional()
  type?: BoardType;

  @ApiPropertyOptional({ description: 'Board description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this is the default board' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Board settings (wipLimits, automations)' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}

import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveCardDto {
  @ApiProperty({ description: 'Target column ID' })
  @IsString()
  @IsNotEmpty()
  columnId!: string;

  @ApiPropertyOptional({ description: 'Target swimlane ID' })
  @IsString()
  @IsOptional()
  swimlaneId?: string;

  @ApiPropertyOptional({ description: 'Position in the target column' })
  @IsNumber()
  @IsOptional()
  position?: number;
}

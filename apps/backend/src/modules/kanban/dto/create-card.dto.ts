import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardPriority } from '../entities/card.entity';

export class CreateCardDto {
  @ApiProperty({ description: 'Board ID' })
  @IsString()
  @IsNotEmpty()
  boardId!: string;

  @ApiProperty({ description: 'Column ID' })
  @IsString()
  @IsNotEmpty()
  columnId!: string;

  @ApiPropertyOptional({ description: 'Swimlane ID' })
  @IsString()
  @IsOptional()
  swimlaneId?: string;

  @ApiPropertyOptional({ description: 'Conversation ID' })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Contact ID' })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiProperty({ description: 'Card title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Card description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: CardPriority, default: CardPriority.MEDIUM })
  @IsEnum(CardPriority)
  @IsOptional()
  priority?: CardPriority;

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO string)' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Position in column' })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackRating } from '../entities/knowledge-feedback.entity';

export class SubmitFeedbackDto {
  @ApiProperty({ description: 'Knowledge chunk ID' })
  @IsString()
  @IsNotEmpty()
  chunkId!: string;

  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Feedback rating', enum: FeedbackRating })
  @IsEnum(FeedbackRating)
  rating!: FeedbackRating;

  @ApiPropertyOptional({ description: 'Optional comment' })
  @IsString()
  @IsOptional()
  comment?: string;
}

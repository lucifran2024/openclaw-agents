import { IsString, IsEnum, IsOptional, Length } from 'class-validator';
import {
  ConversationStatus,
  ConversationPriority,
} from '../conversation.entity';

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @Length(26, 26)
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @Length(26, 26)
  teamId?: string;

  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;
}

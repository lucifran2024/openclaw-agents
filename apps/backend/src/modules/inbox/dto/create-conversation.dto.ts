import {
  IsString,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';
import {
  ConversationChannel,
  ConversationType,
  ConversationPriority,
} from '../conversation.entity';

export class CreateConversationDto {
  @IsString()
  @Length(26, 26)
  contactId!: string;

  @IsEnum(ConversationChannel)
  channel!: ConversationChannel;

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;
}

import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  Length,
} from 'class-validator';
import {
  MessageSenderType,
  MessageContentType,
} from '../message.entity';

export class CreateMessageDto {
  @IsEnum(MessageSenderType)
  senderType!: MessageSenderType;

  @IsOptional()
  @IsString()
  @Length(26, 26)
  senderId?: string;

  @IsEnum(MessageContentType)
  contentType!: MessageContentType;

  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

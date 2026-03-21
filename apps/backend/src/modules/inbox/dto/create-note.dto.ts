import {
  IsString,
  IsArray,
  IsOptional,
  Length,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(26, 26, { each: true })
  mentionedUsers?: string[];
}

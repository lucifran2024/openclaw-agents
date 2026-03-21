import { IsString } from 'class-validator';

export class BoardQueryDto {
  @IsString()
  boardId!: string;
}

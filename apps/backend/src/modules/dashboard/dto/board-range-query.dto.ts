import { IsDateString, IsString } from 'class-validator';

export class BoardRangeQueryDto {
  @IsString()
  boardId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

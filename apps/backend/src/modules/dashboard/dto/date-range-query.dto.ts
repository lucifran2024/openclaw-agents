import { IsDateString } from 'class-validator';

export class DateRangeQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

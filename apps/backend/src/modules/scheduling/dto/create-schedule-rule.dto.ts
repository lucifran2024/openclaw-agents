import { IsString, IsNotEmpty, IsNumber, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleRuleDto {
  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;
}

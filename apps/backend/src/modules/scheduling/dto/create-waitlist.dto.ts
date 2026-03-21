import { IsString, IsNotEmpty, IsOptional, IsDateString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWaitlistDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsString()
  @IsNotEmpty()
  contactId!: string;

  @ApiProperty({ description: 'Service type ID' })
  @IsString()
  @IsNotEmpty()
  serviceTypeId!: string;

  @ApiPropertyOptional({ description: 'Preferred resource ID' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({ description: 'Start of preferred date range' })
  @IsDateString()
  preferredDateStart!: string;

  @ApiProperty({ description: 'End of preferred date range' })
  @IsDateString()
  preferredDateEnd!: string;

  @ApiPropertyOptional({ description: 'Preferred start time (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  @IsOptional()
  preferredTimeStart?: string;

  @ApiPropertyOptional({ description: 'Preferred end time (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  @IsOptional()
  preferredTimeEnd?: string;
}

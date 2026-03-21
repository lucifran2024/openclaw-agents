import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsString()
  @IsNotEmpty()
  contactId!: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @ApiProperty({ description: 'Service type ID' })
  @IsString()
  @IsNotEmpty()
  serviceTypeId!: string;

  @ApiProperty({ description: 'Appointment start date/time (ISO 8601)' })
  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional({ description: 'Notes for the appointment' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Unit ID (branch/location)' })
  @IsString()
  @IsOptional()
  unitId?: string;
}

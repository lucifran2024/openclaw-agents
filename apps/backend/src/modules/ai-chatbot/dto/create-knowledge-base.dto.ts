import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeBaseStatus } from '../entities/knowledge-base.entity';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: 'Knowledge base name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Knowledge base description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Status', enum: KnowledgeBaseStatus })
  @IsEnum(KnowledgeBaseStatus)
  @IsOptional()
  status?: KnowledgeBaseStatus;
}

import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRagDto {
  @ApiProperty({ description: 'The query string to search for' })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({ description: 'Filter by knowledge base ID' })
  @IsString()
  @IsOptional()
  knowledgeBaseId?: string;

  @ApiPropertyOptional({ description: 'Max number of results to return', default: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  limit?: number;
}

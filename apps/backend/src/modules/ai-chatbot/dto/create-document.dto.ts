import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentSourceType } from '../entities/knowledge-document.entity';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Document content (raw text)' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Source URL of the document' })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Source type', enum: DocumentSourceType })
  @IsEnum(DocumentSourceType)
  @IsOptional()
  sourceType?: DocumentSourceType;

  @ApiPropertyOptional({ description: 'MIME type of the document' })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

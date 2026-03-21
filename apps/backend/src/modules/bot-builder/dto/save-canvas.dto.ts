import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NodeType } from '../entities/bot-flow-node.entity';

export class CanvasNodePositionDto {
  @ApiProperty()
  @IsNumber()
  x!: number;

  @ApiProperty()
  @IsNumber()
  y!: number;
}

export class CanvasNodeDto {
  @ApiPropertyOptional({ description: 'Node ID (omit for new nodes)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ enum: NodeType })
  @IsEnum(NodeType)
  type!: NodeType;

  @ApiPropertyOptional({ description: 'Node-specific config' })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiProperty({ description: 'Canvas position' })
  @ValidateNested()
  @Type(() => CanvasNodePositionDto)
  position!: CanvasNodePositionDto;
}

export class CanvasEdgeDto {
  @ApiPropertyOptional({ description: 'Edge ID (omit for new edges)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  sourceNodeId!: string;

  @ApiProperty()
  @IsString()
  targetNodeId!: string;

  @ApiPropertyOptional({ description: 'Source handle for condition nodes' })
  @IsString()
  @IsOptional()
  sourceHandle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;
}

export class SaveCanvasDto {
  @ApiProperty({ type: [CanvasNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanvasNodeDto)
  nodes!: CanvasNodeDto[];

  @ApiProperty({ type: [CanvasEdgeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CanvasEdgeDto)
  edges!: CanvasEdgeDto[];
}

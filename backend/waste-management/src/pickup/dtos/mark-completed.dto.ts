import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MarkCompletedDto {
  @ApiProperty({ example: 11.8, description: 'Final measured weight (kg)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualWeightKg: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveredAddress?: string;

  @ApiProperty({ required: false, example: -0.3971 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({ required: false, example: 36.9624 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

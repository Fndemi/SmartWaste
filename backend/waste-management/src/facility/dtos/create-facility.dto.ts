// src/facility/dtos/create-facility.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WasteType } from '../../pickup/schema/pickup.schema';

export class CreateFacilityDto {
  @IsEnum(['recycler', 'transfer', 'landfill'] as any) kind: any;
  @IsString() name: string;
  @IsOptional() @IsString() address?: string;

  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;

  @IsArray() accepts: WasteType[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) capacityKg?: number;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() hours?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class QueryFacilitiesDto {
  @IsOptional() kind?: 'recycler' | 'transfer' | 'landfill';
  @IsOptional() accepts?: WasteType; // filter by a single waste type
  @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @IsOptional() @Type(() => Number) @IsNumber() radiusMeters?: number;
}

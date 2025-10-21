// src/pickup/dtos/assign-facility.dto.ts
import { IsMongoId } from 'class-validator';
export class AssignFacilityDto {
  @IsMongoId()
  facilityId: string;
}

// src/pickup/dtos/recycler.dto.ts
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RecyclerReceiveDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  receivedWeightKg: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecyclerRejectDto {
  @IsString()
  reason: string;
}

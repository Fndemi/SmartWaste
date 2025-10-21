// src/facility/schemas/facility.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WasteType } from '../../pickup/schema/pickup.schema';

@Schema({ timestamps: true })
export class Facility extends Document {
  @Prop({ required: true, enum: ['recycler', 'transfer', 'landfill'] })
  kind: 'recycler' | 'transfer' | 'landfill';

  @Prop({ required: true }) name: string;
  @Prop() address?: string;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [lng, lat]
  } as any)
  geom?: { type: 'Point'; coordinates: [number, number] };

  @Prop({ type: [String], enum: Object.values(WasteType), default: [] })
  accepts: WasteType[];

  @Prop({ min: 0 }) capacityKg?: number;
  @Prop() phone?: string;
  @Prop() email?: string;
  @Prop() hours?: string;

  @Prop({ default: true }) active: boolean;
}
export const FacilitySchema = SchemaFactory.createForClass(Facility);
FacilitySchema.index({ geom: '2dsphere' });
FacilitySchema.index({ accepts: 1, active: 1, kind: 1 });

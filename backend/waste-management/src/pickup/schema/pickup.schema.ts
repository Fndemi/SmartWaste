/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export enum WasteType {
  ORGANIC = 'organic',
  PLASTIC = 'plastic',
  METAL = 'metal',
  PAPER = 'paper',
  GLASS = 'glass',
  E_WASTE = 'e_waste',
  OTHER = 'other',
}

export type PickupDocument = HydratedDocument<Pickup>;
@Schema({ timestamps: true })
export class Pickup {
  @Prop({ enum: WasteType, required: true })
  wasteType: WasteType;

  @Prop({ required: true, min: 0 })
  estimatedWeightKg: number;

  @Prop({ required: true })
  imagePublicId: string;

  @Prop({ required: true })
  imageSecureUrl: string;

  @Prop({ required: true, min: 0, max: 1 })
  contaminationScore: number; // 0..1

  @Prop()
  contaminationLabel?: string; // e.g. "low" | "medium" | "high"

  @Prop({
    default: 'pending',
    enum: [
      'pending',
      'assigned',
      'picked_up',
      'completed',
      'processed',
      'rejected',
      'cancelled',
    ],
  })
  status:
    | 'pending'
    | 'assigned'
    | 'picked_up'
    | 'completed'
    | 'processed'
    | 'rejected'
    | 'cancelled';

  // link to a target facility (where it should be delivered/processed)
  @Prop({ type: Types.ObjectId, ref: 'Facility' })
  facilityId?: Types.ObjectId;

  // recycler intake
  @Prop({ type: Date }) receivedAt?: Date;
  @Prop({ min: 0 }) receivedWeightKg?: number;
  @Prop() recyclerNotes?: string;
  @Prop() recyclerProofPublicId?: string;
  @Prop() recyclerProofUrl?: string;

  @Prop() rejectionReason?: string;

  // Optional metadata
  @Prop()
  description?: string;

  @Prop({ type: Date })
  evaluatedAt?: Date;

  /* who requested */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId;

  /**assigned to */
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo?: Types.ObjectId;

  @Prop({ type: Date }) assignedAt?: Date;

  /**Picked up */
  @Prop({ type: Date }) pickedUpAt?: Date;
  @Prop() driverNotes?: string;
  @Prop() pickupProofPublicId?: string;
  @Prop() pickupProofUrl?: string;

  // Completed
  @Prop({ type: Date }) completedAt?: Date;
  @Prop({ min: 0 }) actualWeightKg?: number;
  @Prop() completionProofPublicId?: string;
  @Prop() completionProofUrl?: string;
  @Prop() deliveredAddress?: string;
  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  } as any)
  deliveredGeom?: { type: 'Point'; coordinates: [number, number] };

  /*human readable address*/
  @Prop()
  address?: string;

  /** Geo location GeoJSON */
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: false,
      index: '2dsphere',
    },
  } as any)
  geom?: { type: 'Point'; coordinates: [number, number] };
}

export const PickupSchema = SchemaFactory.createForClass(Pickup);
PickupSchema.index({ geom: '2dsphere' });
PickupSchema.index({ status: 1, assignedTo: 1, createdAt: -1 });

// Normalize JSON output: string ids, alias URLs to frontend naming
(PickupSchema as any).set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    if (ret._id) ret._id = ret._id.toString();
    if (ret.requestedBy) ret.requestedBy = ret.requestedBy.toString();
    if (ret.assignedTo) ret.assignedTo = ret.assignedTo.toString();
    if (ret.facilityId) ret.facilityId = ret.facilityId.toString();

    // Aliases to match frontend types
    if (ret.imageSecureUrl && !ret.imageUrl) ret.imageUrl = ret.imageSecureUrl;
    if (ret.completionProofUrl && !ret.completionPhotoUrl)
      ret.completionPhotoUrl = ret.completionProofUrl;

    return ret;
  },
});

(PickupSchema as any).set('toObject', {
  virtuals: true,
  versionKey: false,
});

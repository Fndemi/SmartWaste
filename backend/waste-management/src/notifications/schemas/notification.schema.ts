// src/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum NotificationType {
  // Requester notifications
  PICKUP_CREATED = 'PICKUP_CREATED',
  PICKUP_ASSIGNED = 'PICKUP_ASSIGNED',
  PICKUP_PICKED_UP = 'PICKUP_PICKED_UP',
  PICKUP_COMPLETED = 'PICKUP_COMPLETED',
  PICKUP_PROCESSED = 'PICKUP_PROCESSED',
  PICKUP_REJECTED = 'PICKUP_REJECTED',
  PICKUP_CANCELLED = 'PICKUP_CANCELLED',

  // Driver notifications
  PICKUP_ASSIGNED_TO_YOU = 'PICKUP_ASSIGNED_TO_YOU',
  FACILITY_ASSIGNED = 'FACILITY_ASSIGNED',
  PICKUP_REASSIGNED = 'PICKUP_REASSIGNED',

  // Recycler notifications
  PICKUP_INCOMING = 'PICKUP_INCOMING',
  HIGH_CONTAMINATION_WARNING = 'HIGH_CONTAMINATION_WARNING',
}

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: Object.values(NotificationType),
    index: true,
  })
  type: NotificationType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pickup', required: true, index: true })
  pickupId: Types.ObjectId;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  // Optional metadata for richer context
  @Prop({ type: Object })
  metadata?: {
    wasteType?: string;
    estimatedWeight?: number;
    contaminationScore?: number;
    driverName?: string;
    facilityName?: string;
    [key: string]: any;
  };
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes for efficient queries
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ pickupId: 1, type: 1 });

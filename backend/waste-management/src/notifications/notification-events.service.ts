// src/notifications/notification-events.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema'; // Adjust path as needed

// Event payload interfaces
export interface PickupCreatedEvent {
  pickupId: string;
  requesterId: string;
  wasteType: string;
  estimatedWeight: number;
}

export interface PickupAssignedEvent {
  pickupId: string;
  requesterId: string;
  driverId: string;
  wasteType: string;
}

export interface PickupPickedUpEvent {
  pickupId: string;
  requesterId: string;
  driverId: string;
  wasteType: string;
}

export interface PickupCompletedEvent {
  pickupId: string;
  requesterId: string;
  driverId: string;
  wasteType: string;
  actualWeight: number;
  facilityId?: string;
  contaminationScore?: number;
}

export interface PickupProcessedEvent {
  pickupId: string;
  requesterId: string;
  recyclerUserId: string;
  wasteType: string;
  receivedWeight: number;
}

export interface PickupRejectedEvent {
  pickupId: string;
  requesterId: string;
  wasteType: string;
  reason: string;
}

export interface FacilityAssignedEvent {
  pickupId: string;
  driverId: string;
  facilityId: string;
}

@Injectable()
export class NotificationEventsService {
  private readonly logger = new Logger(NotificationEventsService.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @OnEvent('pickup.created')
  async handlePickupCreated(payload: PickupCreatedEvent) {
    try {
      await this.notificationService.notifyPickupCreated(
        payload.pickupId,
        payload.requesterId,
        payload.wasteType,
      );
      this.logger.log(
        `Notification sent for pickup.created: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.created event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.assigned')
  async handlePickupAssigned(payload: PickupAssignedEvent) {
    try {
      // Fetch driver name
      const driver = await this.userModel
        .findById(payload.driverId)
        .select('name')
        .lean();
      const driverName = driver?.name || 'Driver';

      await this.notificationService.notifyPickupAssigned(
        payload.pickupId,
        payload.requesterId,
        payload.driverId,
        driverName,
        payload.wasteType,
      );
      this.logger.log(
        `Notification sent for pickup.assigned: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.assigned event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.picked_up')
  async handlePickupPickedUp(payload: PickupPickedUpEvent) {
    try {
      // Fetch driver name
      const driver = await this.userModel
        .findById(payload.driverId)
        .select('name')
        .lean();
      const driverName = driver?.name || 'Driver';

      await this.notificationService.notifyPickupPickedUp(
        payload.pickupId,
        payload.requesterId,
        driverName,
        payload.wasteType,
      );
      this.logger.log(
        `Notification sent for pickup.picked_up: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.picked_up event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.completed')
  async handlePickupCompleted(payload: PickupCompletedEvent) {
    try {
      // Notify requester
      await this.notificationService.notifyPickupCompleted(
        payload.pickupId,
        payload.requesterId,
        payload.actualWeight,
        payload.wasteType,
      );

      // If high contamination and facility assigned, notify recycler
      if (
        payload.contaminationScore &&
        payload.contaminationScore > 0.7 &&
        payload.facilityId
      ) {
        // You'll need to add a way to get recycler userId from facilityId
        // For now, just log it
        this.logger.warn(
          `High contamination (${payload.contaminationScore}) detected for pickup ${payload.pickupId}`,
        );
      }

      this.logger.log(
        `Notification sent for pickup.completed: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.completed event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.processed')
  async handlePickupProcessed(payload: PickupProcessedEvent) {
    try {
      await this.notificationService.notifyPickupProcessed(
        payload.pickupId,
        payload.requesterId,
        payload.receivedWeight,
        payload.wasteType,
      );
      this.logger.log(
        `Notification sent for pickup.processed: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.processed event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.rejected')
  async handlePickupRejected(payload: PickupRejectedEvent) {
    try {
      await this.notificationService.notifyPickupRejected(
        payload.pickupId,
        payload.requesterId,
        payload.reason,
        payload.wasteType,
      );
      this.logger.log(
        `Notification sent for pickup.rejected: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.rejected event: ${error.message}`,
      );
    }
  }

  @OnEvent('facility.assigned')
  async handleFacilityAssigned(payload: FacilityAssignedEvent) {
    try {
      // Fetch facility details (you'll need to inject Facility model)
      // For now, use placeholder values
      const facilityName = 'Recycling Facility';
      const facilityAddress = 'See map for location';

      await this.notificationService.notifyFacilityAssigned(
        payload.pickupId,
        payload.driverId,
        facilityName,
        facilityAddress,
      );
      this.logger.log(
        `Notification sent for facility.assigned: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle facility.assigned event: ${error.message}`,
      );
    }
  }

  @OnEvent('pickup.incoming')
  async handlePickupIncoming(payload: {
    pickupId: string;
    recyclerUserId: string;
    wasteType: string;
    actualWeight: number;
    driverId: string;
  }) {
    try {
      // Fetch driver name
      const driver = await this.userModel
        .findById(payload.driverId)
        .select('name')
        .lean();
      const driverName = driver?.name || 'Driver';

      await this.notificationService.notifyPickupIncoming(
        payload.pickupId,
        payload.recyclerUserId,
        payload.wasteType,
        payload.actualWeight,
        driverName,
      );
      this.logger.log(
        `Notification sent for pickup.incoming: ${payload.pickupId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle pickup.incoming event: ${error.message}`,
      );
    }
  }
}

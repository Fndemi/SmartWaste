// src/notifications/notification.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
} from './dtos/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel({
        ...dto,
        recipientId: new Types.ObjectId(dto.recipientId),
        pickupId: new Types.ObjectId(dto.pickupId),
        isRead: false,
      });

      await notification.save();
      this.logger.log(
        `Notification created: ${dto.type} for user ${dto.recipientId}`,
      );
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user with pagination and filters
   */
  async findByUser(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{
    data: NotificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, type, isRead } = query;
    const skip = (page - 1) * limit;

    const filter: any = { recipientId: new Types.ObjectId(userId) };
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          'pickupId',
          'wasteType estimatedWeightKg status imageSecureUrl',
        )
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Mark a single notification as read/unread
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    isRead: boolean,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRead,
          readAt: isRead ? new Date() : null,
        },
      },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      {
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Delete all notifications for a user (optional cleanup)
   */
  async deleteAllForUser(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel.deleteMany({
      recipientId: new Types.ObjectId(userId),
    });

    return { deletedCount: result.deletedCount };
  }

  /**
   * Helper: Create notification with template
   */
  async notifyPickupCreated(
    pickupId: string,
    requesterId: string,
    wasteType: string,
  ) {
    return this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_CREATED,
      title: 'Pickup Request Created',
      message: `Your ${wasteType} waste pickup request has been created successfully.`,
      metadata: { wasteType },
    });
  }

  async notifyPickupAssigned(
    pickupId: string,
    requesterId: string,
    driverId: string,
    driverName: string,
    wasteType: string,
  ) {
    // Notify requester
    await this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_ASSIGNED,
      title: 'Driver Assigned',
      message: `${driverName} has been assigned to collect your ${wasteType} waste.`,
      metadata: { driverName, wasteType },
    });

    // Notify driver
    await this.create({
      recipientId: driverId,
      pickupId,
      type: NotificationType.PICKUP_ASSIGNED_TO_YOU,
      title: 'New Pickup Assigned',
      message: `You have been assigned a ${wasteType} waste pickup.`,
      metadata: { wasteType },
    });
  }

  async notifyPickupPickedUp(
    pickupId: string,
    requesterId: string,
    driverName: string,
    wasteType: string,
  ) {
    return this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_PICKED_UP,
      title: 'Waste Picked Up',
      message: `${driverName} has picked up your ${wasteType} waste.`,
      metadata: { driverName, wasteType },
    });
  }

  async notifyPickupCompleted(
    pickupId: string,
    requesterId: string,
    actualWeight: number,
    wasteType: string,
  ) {
    return this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_COMPLETED,
      title: 'Pickup Completed',
      message: `Your ${wasteType} waste (${actualWeight}kg) has been delivered to the recycling facility.`,
      metadata: { actualWeight, wasteType },
    });
  }

  async notifyPickupProcessed(
    pickupId: string,
    requesterId: string,
    receivedWeight: number,
    wasteType: string,
  ) {
    return this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_PROCESSED,
      title: 'Waste Processed',
      message: `Your ${wasteType} waste (${receivedWeight}kg) has been successfully processed at the recycling facility.`,
      metadata: { receivedWeight, wasteType },
    });
  }

  async notifyPickupRejected(
    pickupId: string,
    requesterId: string,
    reason: string,
    wasteType: string,
  ) {
    return this.create({
      recipientId: requesterId,
      pickupId,
      type: NotificationType.PICKUP_REJECTED,
      title: 'Pickup Rejected',
      message: `Your ${wasteType} waste pickup was rejected. Reason: ${reason}`,
      metadata: { reason, wasteType },
    });
  }

  async notifyFacilityAssigned(
    pickupId: string,
    driverId: string,
    facilityName: string,
    facilityAddress: string,
  ) {
    return this.create({
      recipientId: driverId,
      pickupId,
      type: NotificationType.FACILITY_ASSIGNED,
      title: 'Delivery Facility Assigned',
      message: `Deliver waste to ${facilityName} at ${facilityAddress}`,
      metadata: { facilityName, facilityAddress },
    });
  }

  async notifyPickupIncoming(
    pickupId: string,
    recyclerUserId: string,
    wasteType: string,
    actualWeight: number,
    driverName: string,
  ) {
    return this.create({
      recipientId: recyclerUserId,
      pickupId,
      type: NotificationType.PICKUP_INCOMING,
      title: 'Incoming Delivery',
      message: `${driverName} has delivered ${actualWeight}kg of ${wasteType} waste.`,
      metadata: { wasteType, actualWeight, driverName },
    });
  }

  async notifyHighContamination(
    pickupId: string,
    recyclerUserId: string,
    contaminationScore: number,
    wasteType: string,
  ) {
    return this.create({
      recipientId: recyclerUserId,
      pickupId,
      type: NotificationType.HIGH_CONTAMINATION_WARNING,
      title: '⚠️ High Contamination Alert',
      message: `Incoming ${wasteType} waste has high contamination (${Math.round(contaminationScore * 100)}%). Review before accepting.`,
      metadata: { contaminationScore, wasteType },
    });
  }
}

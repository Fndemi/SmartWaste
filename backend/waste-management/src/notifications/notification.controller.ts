// src/notifications/notification.controller.ts (FIXED VERSION)
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { QueryNotificationsDto, MarkReadDto } from './dtos/notification.dto';
import { AuthGuard } from '@nestjs/passport'; // <--- Ensure this is imported!

@ApiTags('notifications')
@UseGuards(AuthGuard('jwt')) // <--- FIX: Auth is now ENFORCED
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications with pagination and filters',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['PICKUP_CREATED', 'PICKUP_ASSIGNED', 'PICKUP_PICKED_UP'],
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async getNotifications(
    @Req() req: any,
    @Query() query: QueryNotificationsDto,
  ) {
    // Get user ID from JWT token. We can rely on req.user since AuthGuard is active.
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;

    const result = await this.notificationService.findByUser(userId, query);

    return {
      status: 'success',
      data: result.data,
      pagination: {
        page: result.page,
        limit: query.limit || 20,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  async getUnreadCount(@Req() req: any) {
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;
    const count = await this.notificationService.getUnreadCount(userId);

    return {
      status: 'success',
      data: { unreadCount: count },
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read/unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @Param('id') id: string,
    @Body() dto: MarkReadDto,
    @Req() req: any,
  ) {
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;
    const notification = await this.notificationService.markAsRead(
      id,
      userId,
      dto.isRead,
    );

    return {
      status: 'success',
      message: `Notification marked as ${dto.isRead ? 'read' : 'unread'}`,
      data: notification,
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;
    const result = await this.notificationService.markAllAsRead(userId);

    return {
      status: 'success',
      message: `Marked ${result.modifiedCount} notifications as read`,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async deleteNotification(@Param('id') id: string, @Req() req: any) {
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;
    await this.notificationService.delete(id, userId);

    return {
      status: 'success',
      message: 'Notification deleted',
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  async deleteAllNotifications(@Req() req: any) {
    // FIX: Removed the fallback ID.
    const userId = req.user?.sub || req.user?._id || req.user?.id;
    const result = await this.notificationService.deleteAllForUser(userId);

    return {
      status: 'success',
      message: `Deleted ${result.deletedCount} notifications`,
      data: result,
    };
  }
}

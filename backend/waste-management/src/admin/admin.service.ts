import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Pickup, PickupDocument } from '../pickup/schema/pickup.schema';
import { Facility, FacilityDocument } from '../facility/schemas/facility.schema';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Pickup.name) private pickupModel: Model<PickupDocument>,
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats() {
    const [
      totalUsers,
      totalPickups,
      totalFacilities,
      pendingPickups,
      completedPickups,
      activeDrivers,
      usersByRole,
      pickupsByStatus,
      recentActivity,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.pickupModel.countDocuments(),
      this.facilityModel.countDocuments(),
      this.pickupModel.countDocuments({ status: 'pending' }),
      this.pickupModel.countDocuments({ status: { $in: ['completed', 'processed'] } }),
      this.userModel.countDocuments({ role: 'DRIVER', isEmailVerified: true }),
      this.getUsersByRole(),
      this.getPickupsByStatus(),
      this.getRecentActivity(),
    ]);

    const totalWeight = await this.pickupModel.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } } } }
    ]);

    return {
      overview: {
        totalUsers,
        totalPickups,
        totalFacilities,
        totalWeight: totalWeight[0]?.total || 0,
      },
      pickups: {
        pending: pendingPickups,
        completed: completedPickups,
        total: totalPickups,
      },
      users: {
        total: totalUsers,
        activeDrivers,
        byRole: usersByRole,
      },
      pickupsByStatus,
      recentActivity,
    };
  }

  async getSystemHealth() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentPickups,
      recentUsers,
      errorLogs,
      avgResponseTime,
      systemUptime,
    ] = await Promise.all([
      this.pickupModel.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      this.userModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      this.getErrorCount(),
      this.getAverageResponseTime(),
      this.getSystemUptime(),
    ]);

    return {
      status: 'healthy',
      metrics: {
        recentPickups24h: recentPickups,
        newUsers7d: recentUsers,
        errorCount24h: errorLogs,
        avgResponseTime,
        systemUptime,
      },
      timestamp: now,
    };
  }

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
    isEmailVerified?: boolean;
  }) {
    const { page, limit, role, search, isEmailVerified } = filters;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (role) query.role = role;
    if (isEmailVerified !== undefined) query.isEmailVerified = isEmailVerified;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      docs: users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's pickup statistics
    const pickupStats = await this.pickupModel.aggregate([
      { $match: { requestedBy: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalPickups: { $sum: 1 },
          completedPickups: { $sum: { $cond: [{ $in: ['$status', ['completed', 'processed']] }, 1, 0] } },
          totalWeight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
        }
      }
    ]);

    return {
      ...user,
      stats: pickupStats[0] || { totalPickups: 0, completedPickups: 0, totalWeight: 0 },
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: true, // Admin-created users are pre-verified
    });

    await user.save();

    return this.userModel
      .findById(user._id)
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
      .lean();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Clean up related data
    await Promise.all([
      this.pickupModel.updateMany(
        { requestedBy: new Types.ObjectId(id) },
        { $unset: { requestedBy: 1 } }
      ),
      this.notificationModel.deleteMany({ userId: new Types.ObjectId(id) }),
    ]);

    return user;
  }

  async verifyUserEmail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { 
        isEmailVerified: true,
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 }
      },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changeUserRole(id: string, role: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==================== PICKUP ANALYTICS ====================
  async getPickupsOverview(filters: { startDate?: Date; endDate?: Date }) {
    const matchStage: any = {};
    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
    }

    const [overview, byWasteType, byStatus, contamination, timeline] = await Promise.all([
      this.getPickupOverviewStats(matchStage),
      this.getPickupsByWasteType(matchStage),
      this.getPickupsByStatus(),
      this.getContaminationStats(matchStage),
      this.getPickupTimeline(matchStage),
    ]);

    return {
      overview,
      byWasteType,
      byStatus,
      contamination,
      timeline,
    };
  }

  async getContaminationReport(filters: { startDate?: Date; endDate?: Date }) {
    const matchStage: any = {};
    if (filters.startDate || filters.endDate) {
      matchStage.createdAt = {};
      if (filters.startDate) matchStage.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchStage.createdAt.$lte = filters.endDate;
    }

    const contamination = await this.pickupModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$contaminationLabel',
          count: { $sum: 1 },
          avgScore: { $avg: '$contaminationScore' },
          totalWeight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
        }
      },
      { $sort: { count: -1 } }
    ]);

    const highContamination = await this.pickupModel
      .find({ ...matchStage, contaminationScore: { $gte: 0.7 } })
      .populate('requestedBy', 'name email')
      .sort({ contaminationScore: -1 })
      .limit(20)
      .lean();

    return {
      summary: contamination,
      highContaminationPickups: highContamination,
    };
  }

  // ==================== SYSTEM MANAGEMENT ====================
  async getSystemLogs(filters: { level?: string; limit: number }) {
    // This would typically integrate with your logging system
    // For now, return mock data
    return {
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'System health check completed',
          service: 'health-monitor',
        },
        {
          timestamp: new Date(Date.now() - 300000),
          level: 'warn',
          message: 'High contamination detected in pickup',
          service: 'contamination-client',
        },
      ],
      total: 2,
    };
  }

  async runSystemCleanup() {
    const results = {
      expiredTokens: 0,
      oldNotifications: 0,
      orphanedFiles: 0,
    };

    // Clean expired tokens
    const expiredTokenResult = await this.userModel.updateMany(
      {
        $or: [
          { emailVerificationExpires: { $lt: new Date() } },
          { passwordResetExpires: { $lt: new Date() } },
        ]
      },
      {
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
          passwordResetToken: 1,
          passwordResetExpires: 1,
        }
      }
    );
    results.expiredTokens = expiredTokenResult.modifiedCount;

    // Clean old notifications (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldNotificationsResult = await this.notificationModel.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true,
    });
    results.oldNotifications = oldNotificationsResult.deletedCount;

    this.logger.log(`System cleanup completed: ${JSON.stringify(results)}`);
    return results;
  }

  // ==================== ANALYTICS ====================
  async getUserActivityAnalytics(period: string) {
    const days = this.getPeriodDays(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activity = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role',
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return { activity, period, startDate };
  }

  async getWasteTrends(period: string) {
    const days = this.getPeriodDays(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await this.pickupModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            wasteType: '$wasteType',
          },
          count: { $sum: 1 },
          totalWeight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return { trends, period, startDate };
  }

  // ==================== NOTIFICATIONS ====================
  async sendBroadcastNotification(data: { title: string; message: string; type: string }) {
    const users = await this.userModel.find({ isEmailVerified: true }).select('_id').lean();
    
    const notifications = users.map(user => ({
      userId: user._id,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
    }));

    await this.notificationModel.insertMany(notifications);

    return { sent: notifications.length };
  }

  // ==================== HELPER METHODS ====================
  private async getUsersByRole() {
    return this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  private async getPickupsByStatus() {
    return this.pickupModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  private async getRecentActivity() {
    const recentPickups = await this.pickupModel
      .find()
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentUsers = await this.userModel
      .find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return { recentPickups, recentUsers };
  }

  private async getPickupOverviewStats(matchStage: any) {
    return this.pickupModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalWeight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
          avgContamination: { $avg: '$contaminationScore' },
          completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'processed']] }, 1, 0] } },
        }
      }
    ]);
  }

  private async getPickupsByWasteType(matchStage: any) {
    return this.pickupModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$wasteType',
          count: { $sum: 1 },
          totalWeight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  private async getContaminationStats(matchStage: any) {
    return this.pickupModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$contaminationLabel',
          count: { $sum: 1 },
          avgScore: { $avg: '$contaminationScore' },
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  private async getPickupTimeline(matchStage: any) {
    return this.pickupModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          weight: { $sum: { $ifNull: ['$actualWeightKg', '$estimatedWeightKg'] } },
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  private async getErrorCount() {
    // Mock implementation - integrate with your logging system
    return Math.floor(Math.random() * 10);
  }

  private async getAverageResponseTime() {
    // Mock implementation - integrate with your monitoring system
    return Math.floor(Math.random() * 500) + 100;
  }

  private async getSystemUptime() {
    return process.uptime();
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }
}

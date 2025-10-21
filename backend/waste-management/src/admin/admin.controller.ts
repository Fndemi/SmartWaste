import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD STATS ====================
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.adminService.getDashboardStats();
    return { status: 'success', data: stats };
  }

  @Get('dashboard/system-health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ status: 200, description: 'System health metrics retrieved successfully' })
  async getSystemHealth() {
    const health = await this.adminService.getSystemHealth();
    return { status: 'success', data: health };
  }

  // ==================== USER MANAGEMENT ====================
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'isEmailVerified', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isEmailVerified') isEmailVerified?: string,
  ) {
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      search,
      isEmailVerified: isEmailVerified === 'true' ? true : isEmailVerified === 'false' ? false : undefined,
    };
    const users = await this.adminService.getAllUsers(filters);
    return { status: 'success', data: users };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseObjectIdPipe) id: string) {
    const user = await this.adminService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { status: 'success', data: user };
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.adminService.createUser(createUserDto);
    return { status: 'success', message: 'User created successfully', data: user };
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.adminService.updateUser(id, updateUserDto);
    return { status: 'success', message: 'User updated successfully', data: user };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseObjectIdPipe) id: string) {
    await this.adminService.deleteUser(id);
    return { status: 'success', message: 'User deleted successfully' };
  }

  @Put('users/:id/verify-email')
  @ApiOperation({ summary: 'Manually verify user email' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyUserEmail(@Param('id', ParseObjectIdPipe) id: string) {
    await this.adminService.verifyUserEmail(id);
    return { status: 'success', message: 'Email verified successfully' };
  }

  @Put('users/:id/change-role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role changed successfully' })
  async changeUserRole(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('role') role: string,
  ) {
    if (!['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }
    const user = await this.adminService.changeUserRole(id, role);
    return { status: 'success', message: 'Role changed successfully', data: user };
  }

  // ==================== PICKUP MANAGEMENT ====================
  @Get('pickups/overview')
  @ApiOperation({ summary: 'Get pickups overview and analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Pickups overview retrieved successfully' })
  async getPickupsOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const overview = await this.adminService.getPickupsOverview({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { status: 'success', data: overview };
  }

  @Get('pickups/contamination-report')
  @ApiOperation({ summary: 'Get contamination analysis report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Contamination report retrieved successfully' })
  async getContaminationReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.adminService.getContaminationReport({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { status: 'success', data: report };
  }

  // ==================== SYSTEM MANAGEMENT ====================
  @Get('system/logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiQuery({ name: 'level', required: false, enum: ['error', 'warn', 'info', 'debug'] })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiResponse({ status: 200, description: 'System logs retrieved successfully' })
  async getSystemLogs(
    @Query('level') level?: string,
    @Query('limit') limit = '100',
  ) {
    const logs = await this.adminService.getSystemLogs({
      level,
      limit: parseInt(limit),
    });
    return { status: 'success', data: logs };
  }

  @Post('system/cleanup')
  @ApiOperation({ summary: 'Run system cleanup tasks' })
  @ApiResponse({ status: 200, description: 'Cleanup tasks completed successfully' })
  async runSystemCleanup() {
    const result = await this.adminService.runSystemCleanup();
    return { status: 'success', message: 'Cleanup completed', data: result };
  }

  // ==================== ANALYTICS ====================
  @Get('analytics/user-activity')
  @ApiOperation({ summary: 'Get user activity analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  @ApiResponse({ status: 200, description: 'User activity analytics retrieved successfully' })
  async getUserActivityAnalytics(@Query('period') period = '30d') {
    const analytics = await this.adminService.getUserActivityAnalytics(period);
    return { status: 'success', data: analytics };
  }

  @Get('analytics/waste-trends')
  @ApiOperation({ summary: 'Get waste collection trends' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  @ApiResponse({ status: 200, description: 'Waste trends retrieved successfully' })
  async getWasteTrends(@Query('period') period = '30d') {
    const trends = await this.adminService.getWasteTrends(period);
    return { status: 'success', data: trends };
  }

  // ==================== NOTIFICATIONS ====================
  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Send broadcast notification to all users' })
  @ApiResponse({ status: 200, description: 'Broadcast notification sent successfully' })
  async sendBroadcastNotification(
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('type') type?: string,
  ) {
    if (!title || !message) {
      throw new BadRequestException('Title and message are required');
    }
    const result = await this.adminService.sendBroadcastNotification({
      title,
      message,
      type: type || 'info',
    });
    return { status: 'success', message: 'Broadcast notification sent', data: result };
  }
}

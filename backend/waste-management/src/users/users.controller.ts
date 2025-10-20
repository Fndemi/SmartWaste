/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  UseGuards,
  Put,
  Post,
  Body,
  Query,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  Delete,
  Param,
  Res,
  Redirect,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser, CurrentUserType } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  /**
   * ✅ Get current authenticated user's profile
   * No redundant DB lookup — uses user info from JWT payload
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: "Returns the authenticated user's profile",
  })
  async getProfile(@CurrentUser() user: CurrentUserType | null) {
    if (!user?.sub) {
      throw new UnauthorizedException(
        'You must be logged in to access this resource',
      );
    }

    // Fetch the latest user profile from DB to match frontend expectations
    const profile = await this.usersService.findById(user.sub);
    return profile;
  }

  /**
   * ✅ Verify email with token
   */
  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email using token' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend success page' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.usersService.verifyEmail(token);
      
      // Get frontend URL from config
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
      const successUrl = `${frontendUrl}/verify-email?status=success`;
      
      return res.redirect(successUrl);
    } catch (error) {
      // Get frontend URL from config
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
      
      if (error instanceof BadRequestException) {
        // Redirect to frontend with error status for expired/invalid tokens
        const errorUrl = `${frontendUrl}/verify-email?status=error&message=${encodeURIComponent(error.message)}`;
        return res.redirect(errorUrl);
      }
      
      // For other errors, redirect with generic error
      const errorUrl = `${frontendUrl}/verify-email?status=error&message=${encodeURIComponent('Failed to verify email')}`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * ✅ Resend verification email
   */
  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: Object, description: 'Email payload', required: true })
  @HttpCode(200)
  async resendVerification(@Body('email') email: string) {
    try {
      return await this.usersService.resendVerificationEmail(email);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to process verification email',
      );
    }
  }

  /**
   * ✅ Update current user's profile
   */
  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @CurrentUser() user: CurrentUserType | null,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    if (!user?.sub) {
      throw new UnauthorizedException(
        'You must be logged in to update profile',
      );
    }

    try {
      return await this.usersService.updateProfile(user.sub, updateProfileDto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * ✅ Change user password
   */
  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @CurrentUser() user: CurrentUserType | null,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    if (!user?.sub) {
      throw new UnauthorizedException(
        'You must be logged in to change password',
      );
    }

    try {
      await this.usersService.changePassword(user.sub, changePasswordDto);
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  /**
   * ✅ Delete a user by ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  async deleteUser(@Param('id', ParseObjectIdPipe) id: string) {
    try {
      return await this.usersService.deleteUser(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * ✅ Fetch all users
   */
  @Get('allusers')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    try {
      return await this.usersService.getAllUsers();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeederService {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedAdmin() {
    this.logger.log('🌱 Starting admin seeding...');

    try {
      // Check if admin already exists
      const existingAdmin = await this.userModel.findOne({ 
        email: 'admin@wastevortex.com' 
      });

      if (existingAdmin) {
        this.logger.log('✅ Admin user already exists');
        return {
          success: true,
          message: 'Admin user already exists',
          admin: {
            email: existingAdmin.email,
            name: existingAdmin.name,
            role: existingAdmin.role,
          }
        };
      }

      // Create admin user
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!@#';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const adminUser = new this.userModel({
        name: 'System Administrator',
        email: 'admin@wastevortex.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        phone: '+1234567890',
        address: 'System Administration Office',
      });

      await adminUser.save();

      this.logger.log('✅ Admin user created successfully');
      this.logger.log(`📧 Email: admin@wastevortex.com`);
      this.logger.log(`🔑 Password: ${adminPassword}`);
      this.logger.warn('⚠️  Please change the default password after first login!');

      return {
        success: true,
        message: 'Admin user created successfully',
        admin: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          defaultPassword: adminPassword,
        }
      };

    } catch (error) {
      this.logger.error('❌ Admin seeding failed:', error);
      throw error;
    }
  }

  async seedTestUsers() {
    this.logger.log('🌱 Starting test users seeding...');

    const testUsers = [
      {
        name: 'John Household',
        email: 'household@test.com',
        password: 'Test123!',
        role: 'HOUSEHOLD',
        phone: '+1234567891',
        address: '123 Residential St, City',
      },
      {
        name: 'Jane SME Owner',
        email: 'sme@test.com',
        password: 'Test123!',
        role: 'SME',
        phone: '+1234567892',
        address: '456 Business Ave, City',
      },
      {
        name: 'Mike Driver',
        email: 'driver@test.com',
        password: 'Test123!',
        role: 'DRIVER',
        phone: '+1234567893',
        address: '789 Transport Rd, City',
      },
      {
        name: 'Sarah Recycler',
        email: 'recycler@test.com',
        password: 'Test123!',
        role: 'RECYCLER',
        phone: '+1234567894',
        address: '321 Recycling Center, City',
      },
      {
        name: 'Council Officer',
        email: 'council@test.com',
        password: 'Test123!',
        role: 'COUNCIL',
        phone: '+1234567895',
        address: 'City Council Building, City',
      },
    ];

    const createdUsers: any[] = [];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email: userData.email });
        
        if (existingUser) {
          this.logger.log(`✅ Test user ${userData.email} already exists`);
          createdUsers.push({
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            status: 'already_exists'
          });
          continue;
        }

        // Create test user
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const { password, ...userDataWithoutPassword } = userData;
        const user = new this.userModel({
          ...userDataWithoutPassword,
          passwordHash: hashedPassword,
          isEmailVerified: true,
        });

        await user.save();

        this.logger.log(`✅ Test user created: ${userData.email}`);
        createdUsers.push({
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'created'
        });

      } catch (error) {
        this.logger.error(`❌ Failed to create test user ${userData.email}:`, error);
        createdUsers.push({
          email: userData.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.logger.log(`✅ Test users seeding completed. Created/Found: ${createdUsers.length}`);
    return {
      success: true,
      message: 'Test users seeding completed',
      users: createdUsers
    };
  }

  async seedAll() {
    this.logger.log('🌱 Starting complete seeding process...');

    const results: any = {
      admin: null,
      testUsers: null,
    };

    try {
      // Seed admin
      results.admin = await this.seedAdmin();
      
      // Seed test users
      results.testUsers = await this.seedTestUsers();

      this.logger.log('🎉 Complete seeding process finished successfully!');
      return {
        success: true,
        message: 'Complete seeding process finished successfully',
        results
      };

    } catch (error) {
      this.logger.error('❌ Seeding process failed:', error);
      throw error;
    }
  }

  async resetAdmin() {
    this.logger.log('🔄 Resetting admin user...');

    try {
      // Delete existing admin
      await this.userModel.deleteOne({ email: 'admin@wastevortex.com' });
      this.logger.log('🗑️ Existing admin user deleted');

      // Create new admin
      const result = await this.seedAdmin();
      
      this.logger.log('✅ Admin user reset successfully');
      return result;

    } catch (error) {
      this.logger.error('❌ Admin reset failed:', error);
      throw error;
    }
  }
}

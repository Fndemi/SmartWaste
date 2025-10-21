import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminSeederService } from '../src/seeders/admin-seeder.service';

async function seedAdmin() {
  console.log('🚀 Starting admin seeding process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const seederService = app.get(AdminSeederService);
    const result = await seederService.seedAdmin();
    
    console.log('✅ Admin seeding completed successfully!');
    console.log('📋 Result:', JSON.stringify(result, null, 2));
    
    if (result.admin?.defaultPassword) {
      console.log('\n🔐 IMPORTANT: Default admin credentials:');
      console.log(`📧 Email: ${result.admin.email}`);
      console.log(`🔑 Password: ${result.admin.defaultPassword}`);
      console.log('⚠️  Please change the password after first login!\n');
    }
    
  } catch (error) {
    console.error('❌ Admin seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error) => {
  console.error('❌ Failed to run admin seeding:', error);
  process.exit(1);
});

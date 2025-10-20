import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AdminSeederService } from '../src/seeders/admin-seeder.service';

async function seedAll() {
  console.log('🚀 Starting complete seeding process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const seederService = app.get(AdminSeederService);
    const result = await seederService.seedAll();
    
    console.log('✅ Complete seeding process finished successfully!');
    console.log('📋 Results:', JSON.stringify(result, null, 2));
    
    // Display admin credentials if created
    if ((result as any).results?.admin?.admin?.defaultPassword) {
      console.log('\n🔐 ADMIN CREDENTIALS:');
      console.log(`📧 Email: ${(result as any).results.admin.admin.email}`);
      console.log(`🔑 Password: ${(result as any).results.admin.admin.defaultPassword}`);
      console.log('⚠️  Please change the password after first login!');
    }
    
    // Display test user credentials
    if ((result as any).results?.testUsers?.users) {
      console.log('\n👥 TEST USER CREDENTIALS:');
      (result as any).results.testUsers.users.forEach((user: any) => {
        if (user.status === 'created' || user.status === 'already_exists') {
          console.log(`📧 ${user.email} (${user.role}) - Password: Test123!`);
        }
      });
    }
    
    console.log('\n🎉 All users are ready to use!');
    
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedAll().catch((error) => {
  console.error('❌ Failed to run seeding process:', error);
  process.exit(1);
});

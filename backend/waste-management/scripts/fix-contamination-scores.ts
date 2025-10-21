import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FixContaminationScoresMigration } from '../src/migrations/fix-contamination-scores';

async function runMigration() {
  console.log('🚀 Starting contamination scores fix migration...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const migration = app.get(FixContaminationScoresMigration);
    await migration.run();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration().catch((error) => {
  console.error('❌ Failed to run migration:', error);
  process.exit(1);
});

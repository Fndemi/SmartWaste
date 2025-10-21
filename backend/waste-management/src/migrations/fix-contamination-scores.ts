import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pickup, PickupDocument } from '../pickup/schema/pickup.schema';

@Injectable()
export class FixContaminationScoresMigration {
  private readonly logger = new Logger(FixContaminationScoresMigration.name);

  constructor(
    @InjectModel(Pickup.name) private pickupModel: Model<PickupDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔧 Starting contamination scores migration...');

    try {
      // Find all pickups with contamination scores > 1
      const invalidPickups = await this.pickupModel.find({
        contaminationScore: { $gt: 1 }
      });

      this.logger.log(`Found ${invalidPickups.length} pickups with invalid contamination scores`);

      let fixedCount = 0;
      for (const pickup of invalidPickups) {
        const oldScore = pickup.contaminationScore;
        let newScore: number;

        // Normalize the score based on the value range
        if (oldScore > 10) {
          // Assume percentage (0-100) -> convert to 0-1
          newScore = oldScore / 100;
        } else if (oldScore > 1) {
          // Assume 1-10 scale -> convert to 0-1
          newScore = (oldScore - 1) / 9;
        } else {
          // Already 0-1, shouldn't reach here but just in case
          newScore = oldScore;
        }

        // Clamp to 0-1 range
        newScore = Math.max(0, Math.min(1, newScore));

        // Update the pickup
        await this.pickupModel.updateOne(
          { _id: pickup._id },
          { $set: { contaminationScore: newScore } }
        );

        this.logger.debug(`Fixed pickup ${pickup._id}: ${oldScore} -> ${newScore}`);
        fixedCount++;
      }

      this.logger.log(`✅ Migration completed. Fixed ${fixedCount} pickups.`);
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pickup } from 'src/pickup/schema/pickup.schema';

@Controller('council')
export class CouncilController {
  constructor(
    @InjectModel(Pickup.name) private readonly pickupModel: Model<Pickup>,
  ) {}

  @Get('stats/overview')
  async overview(@Query('from') from?: string, @Query('to') to?: string) {
    const match: Record<string, unknown> = {};
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);

    const [byStatus, byType, totals] = await Promise.all([
      this.pickupModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.pickupModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$wasteType',
            count: { $sum: 1 },
            totalWeightKg: { $sum: '$estimatedWeightKg' },
            avgContamination: { $avg: '$contaminationScore' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      this.pickupModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalWeightKg: { $sum: '$estimatedWeightKg' },
            avgContamination: { $avg: '$contaminationScore' },
            processed: {
              $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    return {
      status: 'success',
      data: { byStatus, byType, totals: totals[0] ?? null },
    };
  }
}

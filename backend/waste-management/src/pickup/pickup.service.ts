import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pickup, PickupDocument } from './schema/pickup.schema';
import { Model, Types } from 'mongoose';
import { UploadsService } from 'src/uploads/uploads.service';
import { ContaminationClient } from './contamination.client';
import { CreatePickupDto } from './dtos/create-pickup.dto';
import { Express } from 'express';
import { MarkPickedUpDto } from './dtos/mark-picked-up.dto';
import { MarkCompletedDto } from './dtos/mark-completed.dto';
import {
  RecyclerReceiveDto,
  RecyclerRejectDto,
} from './dtos/assign-facility.dto';
// ✅ ADD THIS IMPORT
import { EventEmitter2 } from '@nestjs/event-emitter';

const ALLOWED: Record<string, string[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['completed', 'cancelled'],
  completed: ['processed', 'rejected'], // <-- recycler step
  processed: [],
  rejected: [],
  cancelled: [],
};

@Injectable()
export class PickupService {
  private readonly logger = new Logger(PickupService.name);

  constructor(
    @InjectModel(Pickup.name)
    private readonly pickupModel: Model<PickupDocument>,
    private readonly uploadsService: UploadsService,
    private readonly contaminationClient: ContaminationClient,
    // ✅ ADD THIS INJECTION
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPickup(
    dto: CreatePickupDto,
    image: Express.Multer.File,
    requestedBy: string,
  ) {
    this.logger.log(
      `[createPickup] requestedBy=${requestedBy} dto=${JSON.stringify(dto)} file={type:${image?.mimetype},size:${image?.size}}`,
    );
    if (!requestedBy) throw new BadRequestException('User not found');
    if (!image) throw new BadRequestException('Image file is required');

    let uploaded: { publicId: string; secureUrl: string };
    try {
      uploaded = await this.uploadsService.uploadSingleImage(image);
      this.logger.debug(
        `[createPickup] image uploaded publicId=${uploaded.publicId}`,
      );
    } catch (err: any) {
      this.logger.error(
        `[createPickup] image upload failed: ${err?.message}`,
        err?.stack,
      );
      throw new BadRequestException('Image upload failed');
    }

    const hasCoords =
      typeof dto.lat === 'number' && Number.isFinite(dto.lat) &&
      typeof dto.lng === 'number' && Number.isFinite(dto.lng);

    const location =
      dto.address ||
      (hasCoords
        ? `Coordinates: ${dto.lat!.toFixed(4)}, ${dto.lng!.toFixed(4)}`
        : 'Location not specified');

    let scoreRes: { score: number; label: string };
    try {
      scoreRes = await this.contaminationClient.scoreImageByUrl(
        uploaded.secureUrl,
        dto.wasteType,
        location,
      );
      if (Number.isNaN(scoreRes.score))
        throw new Error('Invalid score from model');
      this.logger.debug(
        `[createPickup] URL scoring ok score=${scoreRes.score} label=${scoreRes.label}`,
      );
    } catch (e: any) {
      this.logger.warn(
        `[createPickup] URL scoring failed (${e?.message}), trying buffer`,
      );
      scoreRes = await this.contaminationClient.scoreByBuffer(
        image.buffer,
        image.originalname,
        dto.wasteType,
        location,
      );
      this.logger.debug(
        `[createPickup] Buffer scoring ok score=${scoreRes.score} label=${scoreRes.label}`,
      );
    }

    const doc = new this.pickupModel({
      wasteType: dto.wasteType,
      estimatedWeightKg: dto.estimatedWeightKg,
      description: dto.description,
      imagePublicId: uploaded.publicId,
      imageSecureUrl: uploaded.secureUrl,
      contaminationScore: (() => {
        // Handle different score formats: 0-1, 1-10, 0-100
        let normalizedScore = scoreRes.score;
        if (scoreRes.score > 10) {
          // Assume percentage (0-100) -> convert to 0-1
          normalizedScore = scoreRes.score / 100;
        } else if (scoreRes.score > 1) {
          // Assume 1-10 scale -> convert to 0-1
          normalizedScore = (scoreRes.score - 1) / 9;
        }
        // If already 0-1, use as is
        const finalScore = Math.max(0, Math.min(1, normalizedScore));
        this.logger.debug(
          `[createPickup] Score conversion: ${scoreRes.score} -> ${finalScore}`,
        );
        return finalScore;
      })(),
      contaminationLabel: scoreRes.label,
      evaluatedAt: new Date(),
      status: 'pending',
      requestedBy: new Types.ObjectId(requestedBy),
      address: dto.address,
      geom:
        hasCoords
          ? { type: 'Point', coordinates: [dto.lng as number, dto.lat as number] }
          : undefined,
    });

    this.logger.debug(
      `[createPickup] saving doc geom=${JSON.stringify(doc.geom)} address=${doc.address}`,
    );

    await doc.save();
    this.logger.log(
      `[createPickup] saved id=${String(doc._id)} requestedBy=${requestedBy}`,
    );

    // ✅ EMIT EVENT: Pickup created
    this.eventEmitter.emit('pickup.created', {
      pickupId: String(doc._id),
      requesterId: requestedBy,
      wasteType: dto.wasteType,
      estimatedWeight: dto.estimatedWeightKg,
    });

    return doc;
  }

  async listAvailable(
    lng?: number,
    lat?: number,
    radiusMeters = 5000,
    limit = 50,
  ) {
    const q: any = {
      status: 'pending',
      $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }],
    };
    if (lng != null && lat != null) {
      q.geom = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      };
    }
    return this.pickupModel
      .find(q)
      .limit(limit)
      .sort({ contaminationScore: -1 });
  }

  async claim(id: string, driverId: string) {
    const updated = await this.pickupModel.findOneAndUpdate(
      {
        _id: id,
        status: 'pending',
        $or: [{ assignedTo: { $exists: false } }, { assignedTo: null }],
      },
      {
        $set: {
          status: 'assigned',
          assignedTo: new Types.ObjectId(driverId),
          assignedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Pickup not found or already assigned');
    }

    // ✅ EMIT EVENT: Pickup assigned
    this.eventEmitter.emit('pickup.assigned', {
      pickupId: String(updated._id),
      requesterId: String(updated.requestedBy),
      driverId,
      wasteType: updated.wasteType,
    });

    return updated;
  }

  async assignTo(id: string, newDriverId: string) {
    const updated = await this.pickupModel.findOneAndUpdate(
      { _id: id, status: { $in: ['pending', 'assigned'] } },
      {
        $set: {
          status: 'assigned',
          assignedTo: new Types.ObjectId(newDriverId),
          assignedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updated)
      throw new NotFoundException('Pickup not found or not reassignable');

    // ✅ EMIT EVENT: Pickup assigned
    this.eventEmitter.emit('pickup.assigned', {
      pickupId: String(updated._id),
      requesterId: String(updated.requestedBy),
      driverId: newDriverId,
      wasteType: updated.wasteType,
    });

    return updated.toJSON();
  }

  async markPickedUp(id: string, driverId: string, dto: MarkPickedUpDto) {
    const doc = await this.pickupModel.findById(id);
    if (!doc) throw new NotFoundException('Pickup not found');

    if (doc.status !== 'assigned') {
      throw new BadRequestException(
        `Invalid transition ${doc.status} -> picked_up`,
      );
    }

    doc.driverNotes = dto?.notes ?? doc.driverNotes;
    doc.status = 'picked_up';
    doc.pickedUpAt = new Date();

    await doc.save();

    // ✅ EMIT EVENT: Pickup picked up
    this.eventEmitter.emit('pickup.picked_up', {
      pickupId: String(doc._id),
      requesterId: String(doc.requestedBy),
      driverId,
      wasteType: doc.wasteType,
    });

    return doc.toJSON();
  }

  async markCompleted(
    id: string,
    driverId: string,
    dto: MarkCompletedDto,
    photo?: Express.Multer.File,
  ) {
    const doc = await this.pickupModel.findById(id);
    if (!doc) throw new NotFoundException('Pickup not found');

    if (doc.status !== 'picked_up') {
      throw new BadRequestException(
        `Invalid transition ${doc.status} -> completed`,
      );
    }

    if (photo) {
      const up = await this.uploadsService.uploadSingleImage(photo);
      doc.completionProofPublicId = up.publicId;
      doc.completionProofUrl = up.secureUrl;
    }
    doc.actualWeightKg = dto.actualWeightKg;
    doc.deliveredAddress = dto.deliveredAddress ?? doc.deliveredAddress;

    if (dto.lat != null && dto.lng != null) {
      doc.deliveredGeom = { type: 'Point', coordinates: [dto.lng, dto.lat] };
    }

    doc.status = 'completed';
    doc.completedAt = new Date();

    await doc.save();

    // ✅ EMIT EVENT: Pickup completed
    this.eventEmitter.emit('pickup.completed', {
      pickupId: String(doc._id),
      requesterId: String(doc.requestedBy),
      driverId,
      wasteType: doc.wasteType,
      actualWeight: dto.actualWeightKg,
      facilityId: doc.facilityId ? String(doc.facilityId) : undefined,
      contaminationScore: doc.contaminationScore,
    });

    return doc.toJSON();
  }

  async assignFacility(pickupId: string, facilityId: string) {
    const doc = await this.pickupModel.findById(pickupId);
    if (!doc) throw new NotFoundException('Pickup not found');
    if (
      !['assigned', 'picked_up', 'completed', 'pending'].includes(doc.status)
    ) {
      throw new BadRequestException('Cannot assign facility in this status');
    }

    doc.facilityId = new Types.ObjectId(facilityId);
    await doc.save();

    // ✅ EMIT EVENT: Facility assigned (only if driver is assigned)
    if (doc.assignedTo) {
      this.eventEmitter.emit('facility.assigned', {
        pickupId: String(doc._id),
        driverId: String(doc.assignedTo),
        facilityId,
      });
    }

    return doc.toJSON();
  }

  async recyclerReceive(
    id: string,
    recyclerUserId: string,
    dto: RecyclerReceiveDto,
    proof?: Express.Multer.File,
  ) {
    const doc = await this.pickupModel.findById(id);
    if (!doc) throw new NotFoundException('Pickup not found');
    if (!ALLOWED[doc.status]?.includes('processed')) {
      throw new BadRequestException(
        `Invalid transition ${doc.status} -> processed`,
      );
    }

    if (proof) {
      const up = await this.uploadsService.uploadSingleImage(proof);
      doc.recyclerProofPublicId = up.publicId;
      doc.recyclerProofUrl = up.secureUrl;
    }
    doc.receivedWeightKg = dto.receivedWeightKg;
    doc.recyclerNotes = dto.notes;
    doc.receivedAt = new Date();
    doc.status = 'processed';

    await doc.save();

    // ✅ EMIT EVENT: Pickup processed
    this.eventEmitter.emit('pickup.processed', {
      pickupId: String(doc._id),
      requesterId: String(doc.requestedBy),
      recyclerUserId,
      wasteType: doc.wasteType,
      receivedWeight: dto.receivedWeightKg,
    });

    return doc.toJSON();
  }

  async recyclerReject(id: string, dto: RecyclerRejectDto) {
    const doc = await this.pickupModel.findById(id);
    if (!doc) throw new NotFoundException('Pickup not found');
    if (!ALLOWED[doc.status]?.includes('rejected')) {
      throw new BadRequestException(
        `Invalid transition ${doc.status} -> rejected`,
      );
    }
    doc.status = 'rejected';
    doc.rejectionReason = dto.reason;
    await doc.save();

    // ✅ EMIT EVENT: Pickup rejected
    this.eventEmitter.emit('pickup.rejected', {
      pickupId: String(doc._id),
      requesterId: String(doc.requestedBy),
      wasteType: doc.wasteType,
      reason: dto.reason,
    });

    return doc.toJSON();
  }

  async findAll() {
    return this.pickupModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    return this.pickupModel.findById(id).lean();
  }
}

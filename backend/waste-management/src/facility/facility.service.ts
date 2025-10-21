/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Facility } from './schemas/facility.schema';
import { Model } from 'mongoose';
import {
  CreateFacilityDto,
  QueryFacilitiesDto,
} from './dtos/create-facility.dto';

@Injectable()
export class FacilityService {
  constructor(
    @InjectModel(Facility.name) private readonly model: Model<Facility>,
  ) {}

  async create(dto: CreateFacilityDto) {
    const doc = new this.model({
      kind: dto.kind,
      name: dto.name,
      address: dto.address,
      geom:
        dto.lng != null && dto.lat != null
          ? { type: 'Point', coordinates: [dto.lng, dto.lat] }
          : undefined,
      accepts: dto.accepts,
      capacityKg: dto.capacityKg,
      phone: dto.phone,
      email: dto.email,
      hours: dto.hours,
      active: dto.active ?? true,
    });

    return doc.save();
  }

  async list(q: QueryFacilitiesDto) {
    const filter: any = { active: true };
    if (q.kind) filter.kind = q.kind;
    if (q.accepts) filter.accepts = q.accepts;

    let query = this.model.find(filter);
    if (q.lng != null && q.lat != null) {
      query = query.where('geom').near({
        center: { type: 'Point', coordinates: [q.lng, q.lat] },
        maxDistance: q.radiusMeters ?? 10_000,
      });
    }

    return query.sort({ name: 1 }).lean();
  }

  async findById(id: string) {
    return this.model.findById(id).lean();
  }
}

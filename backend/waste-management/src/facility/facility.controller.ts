/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import {
  CreateFacilityDto,
  QueryFacilitiesDto,
} from './dtos/create-facility.dto';
import { FacilityService } from './facility.service';

@Controller('facility')
export class FacilityController {
  constructor(private readonly svc: FacilityService) {}

  //   @UseGuards(AuthGuard('jwt')) // optionally add RolesGuard: COUNCIL/ADMIN
  @Post()
  async create(@Body() dto: CreateFacilityDto) {
    const data = await this.svc.create(dto);
    return { status: 'success', message: 'Facility created', data };
  }

  @Get()
  async list(@Query() q: QueryFacilitiesDto) {
    const data = await this.svc.list(q);
    return { status: 'success', data };
  }

  @Get(':id')
  async get(@Param('id', ParseObjectIdPipe) id: string) {
    const data = await this.svc.findById(id);
    return { status: 'success', data };
  }
}

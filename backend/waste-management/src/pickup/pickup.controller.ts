/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  Query,
  Patch,
  UseGuards,
  BadRequestException,
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PickupService } from './pickup.service';
import { CreatePickupDto } from './dtos/create-pickup.dto';
import { MarkCompletedDto } from './dtos/mark-completed.dto';
import { MarkPickedUpDto } from './dtos/mark-picked-up.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AssignDto } from './dtos/assign.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  AssignFacilityDto,
  RecyclerReceiveDto,
  RecyclerRejectDto,
} from './dtos/assign-facility.dto';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth } from '@nestjs/swagger';

// --- INLINE ROLES DECORATOR + GUARD ---
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
// --------------------------------------

@ApiTags('pickups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard) // JWT + RBAC
@Controller('pickups')
export class PickupController {
  constructor(private readonly pickupsService: PickupService) {}

  @Post()
  @Roles('HOUSEHOLD', 'SME')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        wasteType: {
          type: 'string',
          enum: [
            'organic',
            'plastic',
            'metal',
            'paper',
            'glass',
            'e_waste',
            'other',
          ],
        },
        estimatedWeightKg: { type: 'number', example: 12.5 },
        description: { type: 'string' },
        address: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
      required: ['image', 'wasteType', 'estimatedWeightKg'],
    },
  })
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1000 * 1000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
        ],
      }),
    )
    image: Express.Multer.File,
    @Body() dto: CreatePickupDto,
    @Req() req: any,
  ) {
    const requestedById = req?.user?.sub || req?.user?._id || req?.user?.id;
    const pickup = await this.pickupsService.createPickup(
      dto,
      image,
      requestedById,
    );
    return {
      status: 'success',
      message: 'Pickup created',
      data: pickup,
    };
  }

  // Available queue (open to all logged-in users)
  @Get('available')
  @ApiQuery({ name: 'lng', required: false })
  @ApiQuery({ name: 'lat', required: false })
  @ApiQuery({ name: 'radiusMeters', required: false, example: 5000 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async available(
    @Query('lng') lng?: string,
    @Query('lat') lat?: string,
    @Query('radiusMeters') r?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.pickupsService.listAvailable(
      lng != null ? Number(lng) : undefined,
      lat != null ? Number(lat) : undefined,
      r != null ? Number(r) : 5000,
      limit !== undefined ? Number(limit) : 50,
    );
    return { status: 'success', data };
  }

  @Patch(':id/assign')
  @Roles('COUNCIL', 'ADMIN')
  async assign(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AssignDto,
  ) {
    if (!dto.driverId) throw new BadRequestException('driverId is required');
    const data = await this.pickupsService.assignTo(id, dto.driverId);
    return { status: 'success', message: 'Assigned', data };
  }

  // DRIVER claims
  @Patch(':id/claim')
  @Roles('DRIVER')
  async claim(@Param('id') id: string, @Req() req: { user?: { sub?: string; _id?: string; id?: string } }) {
    const driverId = req?.user?.sub || req?.user?._id || req?.user?.id;
    if (!driverId) throw new BadRequestException('driverId is required');
    const data = await this.pickupsService.claim(id, driverId);
    return { status: 'success', message: 'Claimed', data };
  }

  @Patch(':id/picked-up')
  @Roles('DRIVER')
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string' },
      },
    },
  })
  async pickedUp(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string; _id?: string; id?: string } },
    @Body() dto: MarkPickedUpDto,
  ) {
    const driverId = req?.user?.sub || req?.user?._id || req?.user?.id;
    const data = await this.pickupsService.markPickedUp(id, driverId, dto);
    return { status: 'success', message: 'Marked picked up', data };
  }

  @Patch(':id/completed')
  @Roles('DRIVER')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['actualWeightKg'],
      properties: {
        photo: { type: 'string', format: 'binary' },
        actualWeightKg: { type: 'number', example: 11.8 },
        deliveredAddress: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
      },
    },
  })
  async completed(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string; _id?: string; id?: string } },
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Body() dto: MarkCompletedDto,
  ) {
    const driverId = req?.user?.sub || req?.user?._id || req?.user?.id;
    const data = await this.pickupsService.markCompleted(
      id,
      driverId,
      dto,
      photo,
    );
    return { status: 'success', message: 'Completed', data };
  }

  @Patch(':id/assign-facility')
  @Roles('COUNCIL', 'ADMIN')
  async assignFacility(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AssignFacilityDto,
  ) {
    const data = await this.pickupsService.assignFacility(id, dto.facilityId);
    return { status: 'success', message: 'Facility Assigned', data };
  }

  @Patch(':id/receive')
  @Roles('RECYCLER')
  async receive(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: { user?: { sub?: string; _id?: string; id?: string } },
    @Body() dto: RecyclerReceiveDto,
  ) {
    const recyclerUserId = req?.user?.sub || req?.user?._id || req?.user?.id;
    const data = await this.pickupsService.recyclerReceive(
      id,
      recyclerUserId,
      dto,
    );
    return { status: 'success', message: 'Received', data };
  }

  @Patch(':id/reject')
  @Roles('RECYCLER')
  async reject(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: { user?: { sub?: string; _id?: string; id?: string } },
    @Body() dto: RecyclerRejectDto,
  ) {
    const data = await this.pickupsService.recyclerReject(id, dto);
    return { status: 'success', message: 'Rejected', data };
  }

  // --- AI: Household advice (Gemini) ---
  @Post('ai/household-advice')
  @Roles('HOUSEHOLD', 'SME', 'ADMIN') // adjust roles as needed
  @ApiBody({
    schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: {
          type: 'string',
          example: 'Give me tips to reduce contamination.',
        },
      },
    },
  })
  async householdAdvice(@Body('prompt') prompt: string) {
    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException('prompt is required (string)');
    }

    // Try a few common env var names
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new BadRequestException(
        'Server not configured for Gemini. Set GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY / GOOGLE_API_KEY).',
      );
    }

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' +
      `?key=${apiKey}`;

    try {
      // Node 18+ has global fetch. If you’re on older Node, install node-fetch & import it.
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Gemini HTTP ${res.status}: ${text}`);
      }

      const data: any = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No advice generated.';

      return { status: 'success', text };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Gemini call failed');
    }
  }

  @Get()
  async list() {
    const pickups = await this.pickupsService.findAll();
    return { status: 'success', data: pickups };
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  async getOne(@Param('id') id: string) {
    const pickup = await this.pickupsService.findOne(id);
    return { status: 'success', data: pickup };
  }
}

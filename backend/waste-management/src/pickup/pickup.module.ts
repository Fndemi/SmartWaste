import { Module } from '@nestjs/common';
import { PickupController } from './pickup.controller';
import { PickupService } from './pickup.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Pickup, PickupSchema } from './schema/pickup.schema';
import { UploadsModule } from 'src/uploads/uploads.module';
import { ContaminationClient } from './contamination.client';
import { ContaminationNotificationService } from '../notifications/contamination-notification.service'; // ← ADD THIS IMPORT
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notifications.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pickup.name, schema: PickupSchema }]),
    UploadsModule,
    EventEmitterModule,
    ConfigModule,
    CloudinaryModule,
    MailModule,
    NotificationModule,
  ],
  controllers: [PickupController],
  providers: [
    PickupService,
    ContaminationClient,
    ContaminationNotificationService, // ← ADD THIS
  ],
  exports: [ContaminationClient],
})
export class PickupModule {}

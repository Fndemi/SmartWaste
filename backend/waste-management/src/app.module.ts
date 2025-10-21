import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FacilityModule } from './facility/facility.module';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notifications/notifications.module';
import { PickupModule } from './pickup/pickup.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { SeedersModule } from './seeders/seeders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('✅ Successfully connected to MongoDB');
          });
          connection.on('error', (err: Error) => {
            console.error('❌ MongoDB connection error:', err.message);
          });
          return connection;
        },
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    MailModule,
    UploadsModule,
    PickupModule,
    FacilityModule,
    NotificationModule,
    AdminModule,
    SeedersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

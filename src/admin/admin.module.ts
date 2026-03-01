import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminBookingService } from './booking-admin/admin-booking.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminBookingController } from './booking-admin/admin-booking.controller';
import { AdminTimeSlotService } from './timeslot-admin/admin-time-slot.service';
import { AdminTimeSlotController } from './timeslot-admin/admin-time-slot.controller';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('jwt.expiresIn') || '7d';
        return {
          secret: config.get<string>('jwt.secret'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AdminAuthService, AdminBookingService, AdminTimeSlotService],
  controllers: [
    AdminAuthController,
    AdminBookingController,
    AdminTimeSlotController,
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}

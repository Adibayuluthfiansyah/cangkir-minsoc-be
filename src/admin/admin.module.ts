import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminBookingService } from './admin-booking.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminBookingController } from './admin-booking.controller';
import { AdminTimeSlotService } from './admin-time-slot.service';
import { AdminTimeSlotController } from './admin-time-slot.controller';

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

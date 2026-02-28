import { Module } from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { TimeSlotController } from './time-slot.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TimeSlotService],
  controllers: [TimeSlotController],
  exports: [TimeSlotService],
})
export class TimeSlotModule {}

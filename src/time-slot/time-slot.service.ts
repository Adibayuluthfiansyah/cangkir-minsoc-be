import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TimeSlotListResponseDto,
  TimeSlotDto,
} from './dto/time-slot-response.dto';

@Injectable()
export class TimeSlotService {
  constructor(private readonly prisma: PrismaService) {}

  // get all time slots
  async findAll(): Promise<TimeSlotListResponseDto> {
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { startTime: 'asc' },
    });

    const weekdaySlots: TimeSlotDto[] = [];
    const weekendSlots: TimeSlotDto[] = [];
    let weekdayPrice = 0;
    let weekendPrice = 0;

    timeSlots.forEach((slot) => {
      const slotDto: TimeSlotDto = {
        id: slot.id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayType: slot.dayType,
        price: Number(slot.price),
        isActive: slot.isActive,
        description: slot.description || undefined,
      };

      if (slot.dayType === 'WEEKDAY') {
        weekdaySlots.push(slotDto);
        if (weekdayPrice === 0) weekdayPrice = Number(slot.price);
      } else {
        weekendSlots.push(slotDto);
        if (weekendPrice === 0) weekendPrice = Number(slot.price);
      }
    });

    return {
      weekdaySlots,
      weekendSlots,
      pricing: {
        weekdayPrice,
        weekendPrice,
      },
    };
  }

  // get time slots by day type
  async findByDayType(dayType: 'WEEKDAY' | 'WEEKEND'): Promise<TimeSlotDto[]> {
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        isActive: true,
        dayType,
      },
      orderBy: { startTime: 'asc' },
    });

    return timeSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description || undefined,
    }));
  }

  // get one time slot
  async findOne(id: string): Promise<TimeSlotDto | null> {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!slot) {
      return null;
    }

    return {
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description || undefined,
    };
  }
}

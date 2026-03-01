import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeSlotDto } from '../dto/time-slot/create-time-slot.dto';
import { UpdateTimeSlotDto } from '../dto/time-slot/update-time-slot.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminTimeSlotService {
  constructor(private readonly prisma: PrismaService) {}

  // get all time slots
  async findAll() {
    const timeSlots = await this.prisma.timeSlot.findMany({
      orderBy: [{ dayType: 'asc' }, { startTime: 'asc' }],
    });

    return timeSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));
  }

  // get one time slot
  async findOne(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    return {
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  // create time slot
  async create(dto: CreateTimeSlotDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // check for overlapping time slots
    const overlapping = await this.prisma.timeSlot.findFirst({
      where: {
        dayType: dto.dayType,
        OR: [
          {
            AND: [
              { startTime: { lte: dto.startTime } },
              { endTime: { gt: dto.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: dto.endTime } },
              { endTime: { gte: dto.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: dto.startTime } },
              { endTime: { lte: dto.endTime } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Time slot overlaps with existing slot: ${overlapping.name}`,
      );
    }

    const slot = await this.prisma.timeSlot.create({
      data: {
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        dayType: dto.dayType,
        price: new Prisma.Decimal(dto.price),
        isActive: dto.isActive ?? true,
        description: dto.description,
      },
    });

    return {
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  // update time slot
  async update(id: string, dto: UpdateTimeSlotDto) {
    const existing = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Time slot not found');
    }

    const startTime = dto.startTime || existing.startTime;
    const endTime = dto.endTime || existing.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // check for overlapping (exclude current slot)
    if (dto.startTime || dto.endTime || dto.dayType) {
      const dayType = dto.dayType || existing.dayType;

      const overlapping = await this.prisma.timeSlot.findFirst({
        where: {
          id: { not: id },
          dayType,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new ConflictException(
          `Time slot overlaps with existing slot: ${overlapping.name}`,
        );
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.startTime) updateData.startTime = dto.startTime;
    if (dto.endTime) updateData.endTime = dto.endTime;
    if (dto.dayType) updateData.dayType = dto.dayType;
    if (dto.price !== undefined)
      updateData.price = new Prisma.Decimal(dto.price);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.description !== undefined) updateData.description = dto.description;

    const slot = await this.prisma.timeSlot.update({
      where: { id },
      data: updateData,
    });

    return {
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayType: slot.dayType,
      price: Number(slot.price),
      isActive: slot.isActive,
      description: slot.description,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  // delete time slot
  async remove(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    // Check if time slot has active bookings
    if (slot.bookings.length > 0) {
      throw new BadRequestException(
        'Cannot delete time slot with active bookings. Please cancel or complete all bookings first.',
      );
    }

    await this.prisma.timeSlot.delete({
      where: { id },
    });

    return {
      message: 'Time slot deleted successfully',
      id,
    };
  }

  // toggle timeslots stats
  async toggleActive(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    const updated = await this.prisma.timeSlot.update({
      where: { id },
      data: { isActive: !slot.isActive },
    });

    return {
      id: updated.id,
      isActive: updated.isActive,
      message: `Time slot ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }
}

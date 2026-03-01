import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AdminTimeSlotService } from './admin-time-slot.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('AdminTimeSlotService', () => {
  let service: AdminTimeSlotService;

  const mockTimeSlot = {
    id: '1',
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKDAY' as any,
    price: new Prisma.Decimal(200000),
    isActive: true,
    description: 'Morning slot',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPrismaService = {
    timeSlot: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTimeSlotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminTimeSlotService>(AdminTimeSlotService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all time slots including inactive', async () => {
      const slots = [
        mockTimeSlot,
        { ...mockTimeSlot, id: '2', isActive: false },
      ];
      mockPrismaService.timeSlot.findMany.mockResolvedValue(slots);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);
      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        orderBy: [{ dayType: 'asc' }, { startTime: 'asc' }],
      });
    });

    it('should sort by day type and start time', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([mockTimeSlot]);

      await service.findAll();

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        orderBy: [{ dayType: 'asc' }, { startTime: 'asc' }],
      });
    });

    it('should convert Decimal price to number', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([mockTimeSlot]);

      const result = await service.findAll();

      expect(typeof result[0].price).toBe('number');
      expect(result[0].price).toBe(200000);
    });

    it('should return empty array when no slots exist', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return time slot by ID', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: mockTimeSlot.id,
        name: mockTimeSlot.name,
        startTime: mockTimeSlot.startTime,
        endTime: mockTimeSlot.endTime,
        dayType: mockTimeSlot.dayType,
        price: 200000,
        isActive: mockTimeSlot.isActive,
        description: mockTimeSlot.description,
        createdAt: mockTimeSlot.createdAt,
        updatedAt: mockTimeSlot.updatedAt,
      });
      expect(mockPrismaService.timeSlot.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if time slot not found', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow(
        'Time slot not found',
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: '10:00 - 12:00',
      startTime: '10:00',
      endTime: '12:00',
      dayType: 'WEEKDAY' as any,
      price: 200000,
      isActive: true,
      description: 'Mid-morning slot',
    };

    it('should create time slot successfully', async () => {
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null); // No overlap
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        ...createDto,
        id: '2',
        price: new Prisma.Decimal(createDto.price),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.startTime).toBe(createDto.startTime);
      expect(result.endTime).toBe(createDto.endTime);
      expect(mockPrismaService.timeSlot.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          startTime: createDto.startTime,
          endTime: createDto.endTime,
          dayType: createDto.dayType,
          price: expect.any(Prisma.Decimal),
          isActive: true,
          description: createDto.description,
        },
      });
    });

    it('should throw BadRequestException if start time is after end time', async () => {
      const invalidDto = {
        ...createDto,
        startTime: '12:00',
        endTime: '10:00',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'End time must be after start time',
      );
      expect(mockPrismaService.timeSlot.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if start time equals end time', async () => {
      const invalidDto = {
        ...createDto,
        startTime: '10:00',
        endTime: '10:00',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if time slot overlaps', async () => {
      const overlappingSlot = {
        ...mockTimeSlot,
        startTime: '09:00',
        endTime: '11:00',
      };
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(overlappingSlot);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Time slot overlaps with existing slot',
      );
    });

    it('should check overlap for same day type only', async () => {
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        ...createDto,
        id: '2',
      } as any);

      await service.create(createDto);

      expect(mockPrismaService.timeSlot.findFirst).toHaveBeenCalledWith({
        where: {
          dayType: createDto.dayType,
          OR: expect.any(Array),
        },
      });
    });

    it('should default isActive to true if not provided', async () => {
      const dtoWithoutActive = { ...createDto };
      delete (dtoWithoutActive as any).isActive;

      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        ...dtoWithoutActive,
        isActive: true,
      } as any);

      await service.create(dtoWithoutActive);

      expect(mockPrismaService.timeSlot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      });
    });

    it('should handle optional description', async () => {
      const dtoWithoutDesc = { ...createDto };
      delete (dtoWithoutDesc as any).description;

      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        ...dtoWithoutDesc,
        description: null,
      } as any);

      await service.create(dtoWithoutDesc);

      expect(mockPrismaService.timeSlot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: undefined,
        }),
      });
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Slot',
      startTime: '09:00',
      endTime: '11:00',
    };

    it('should update time slot successfully', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null); // No overlap
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        ...updateDto,
      });

      const result = await service.update('1', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.timeSlot.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          name: updateDto.name,
          startTime: updateDto.startTime,
          endTime: updateDto.endTime,
        }),
      });
    });

    it('should throw NotFoundException if time slot not found', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if updated times are invalid', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);

      const invalidDto = {
        startTime: '12:00',
        endTime: '10:00',
      };

      await expect(service.update('1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if updated slot overlaps', async () => {
      const overlappingSlot = {
        ...mockTimeSlot,
        id: '2',
        startTime: '09:00',
        endTime: '11:00',
      };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(overlappingSlot);

      await expect(service.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should exclude current slot from overlap check', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        ...updateDto,
      });

      await service.update('1', updateDto);

      expect(mockPrismaService.timeSlot.findFirst).toHaveBeenCalledWith({
        where: {
          id: { not: '1' },
          dayType: mockTimeSlot.dayType,
          OR: expect.any(Array),
        },
      });
    });

    it('should allow partial updates', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        name: 'New Name',
      });

      const partialDto = { name: 'New Name' };
      const result = await service.update('1', partialDto);

      expect(result.name).toBe('New Name');
      expect(mockPrismaService.timeSlot.findFirst).not.toHaveBeenCalled(); // No time change, no overlap check
    });

    it('should handle price update', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        price: new Prisma.Decimal(250000),
      });

      const priceDto = { price: 250000 };
      await service.update('1', priceDto);

      expect(mockPrismaService.timeSlot.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          price: expect.any(Prisma.Decimal),
        }),
      });
    });

    it('should handle isActive update', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        isActive: false,
      });

      await service.update('1', { isActive: false });

      expect(mockPrismaService.timeSlot.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('should validate with existing values when only one time is updated', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        startTime: '07:00',
      });

      const dto = { startTime: '07:00' }; // Only update start time
      await service.update('1', dto);

      // Should validate using new startTime (07:00) and existing endTime (10:00)
      expect(mockPrismaService.timeSlot.findFirst).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete time slot successfully', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue({
        ...mockTimeSlot,
        bookings: [],
      });
      mockPrismaService.timeSlot.delete.mockResolvedValue(mockTimeSlot);

      const result = await service.remove('1');

      expect(result).toEqual({
        message: 'Time slot deleted successfully',
        id: '1',
      });
      expect(mockPrismaService.timeSlot.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if time slot not found', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if slot has active bookings', async () => {
      const slotWithBookings = {
        ...mockTimeSlot,
        bookings: [{ id: 'booking-1', status: 'CONFIRMED' }],
      };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(
        slotWithBookings as any,
      );

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('1')).rejects.toThrow(
        'Cannot delete time slot with active bookings',
      );
      expect(mockPrismaService.timeSlot.delete).not.toHaveBeenCalled();
    });

    it('should check for pending and confirmed bookings only', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue({
        ...mockTimeSlot,
        bookings: [],
      });
      mockPrismaService.timeSlot.delete.mockResolvedValue(mockTimeSlot);

      await service.remove('1');

      expect(mockPrismaService.timeSlot.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          bookings: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          },
        },
      });
    });
  });

  describe('toggleActive', () => {
    it('should activate inactive time slot', async () => {
      const inactiveSlot = { ...mockTimeSlot, isActive: false };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(inactiveSlot);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...inactiveSlot,
        isActive: true,
      });

      const result = await service.toggleActive('1');

      expect(result).toEqual({
        id: '1',
        isActive: true,
        message: 'Time slot activated successfully',
      });
      expect(mockPrismaService.timeSlot.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: true },
      });
    });

    it('should deactivate active time slot', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockTimeSlot);
      mockPrismaService.timeSlot.update.mockResolvedValue({
        ...mockTimeSlot,
        isActive: false,
      });

      const result = await service.toggleActive('1');

      expect(result).toEqual({
        id: '1',
        isActive: false,
        message: 'Time slot deactivated successfully',
      });
      expect(mockPrismaService.timeSlot.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if time slot not found', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('overlap validation logic', () => {
    it('should detect overlap when new slot starts inside existing slot', async () => {
      const existingSlot = {
        ...mockTimeSlot,
        startTime: '08:00',
        endTime: '10:00',
      };
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(existingSlot);

      const dto = {
        name: 'Overlapping',
        startTime: '09:00', // Starts inside 08:00-10:00
        endTime: '11:00',
        dayType: 'WEEKDAY' as any,
        price: 200000,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should detect overlap when new slot ends inside existing slot', async () => {
      const existingSlot = {
        ...mockTimeSlot,
        startTime: '10:00',
        endTime: '12:00',
      };
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(existingSlot);

      const dto = {
        name: 'Overlapping',
        startTime: '09:00',
        endTime: '11:00', // Ends inside 10:00-12:00
        dayType: 'WEEKDAY' as any,
        price: 200000,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should detect overlap when new slot completely contains existing slot', async () => {
      const existingSlot = {
        ...mockTimeSlot,
        startTime: '09:00',
        endTime: '10:00',
      };
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(existingSlot);

      const dto = {
        name: 'Overlapping',
        startTime: '08:00',
        endTime: '12:00', // Contains 09:00-10:00
        dayType: 'WEEKDAY' as any,
        price: 200000,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should allow adjacent slots without overlap', async () => {
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        startTime: '10:00',
        endTime: '12:00',
      });

      const dto = {
        name: 'Adjacent',
        startTime: '10:00', // Starts exactly when previous ends
        endTime: '12:00',
        dayType: 'WEEKDAY' as any,
        price: 200000,
      };

      // Should not throw
      await service.create(dto);
      expect(mockPrismaService.timeSlot.create).toHaveBeenCalled();
    });

    it('should allow same time slots for different day types', async () => {
      // Weekday slot exists 08:00-10:00, creating weekend slot 08:00-10:00 should be OK
      mockPrismaService.timeSlot.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.create.mockResolvedValue({
        ...mockTimeSlot,
        dayType: 'WEEKEND' as any,
      });

      const dto = {
        name: 'Weekend Slot',
        startTime: '08:00',
        endTime: '10:00',
        dayType: 'WEEKEND' as any,
        price: 300000,
      };

      await service.create(dto);
      expect(mockPrismaService.timeSlot.create).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TimeSlotService } from './time-slot.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TimeSlotService', () => {
  let service: TimeSlotService;

  const mockWeekdaySlot = {
    id: '1',
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKDAY' as any,
    price: 200000,
    isActive: true,
    description: 'Weekday morning slot',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWeekendSlot = {
    id: '2',
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKEND' as any,
    price: 300000,
    isActive: true,
    description: 'Weekend morning slot',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    timeSlot: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeSlotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TimeSlotService>(TimeSlotService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active time slots grouped by day type', async () => {
      const weekdaySlot2 = {
        ...mockWeekdaySlot,
        id: '3',
        name: '10:00 - 12:00',
        startTime: '10:00',
        endTime: '12:00',
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockWeekdaySlot,
        weekdaySlot2,
        mockWeekendSlot,
      ]);

      const result = await service.findAll();

      expect(result).toEqual({
        weekdaySlots: [
          {
            id: mockWeekdaySlot.id,
            name: mockWeekdaySlot.name,
            startTime: mockWeekdaySlot.startTime,
            endTime: mockWeekdaySlot.endTime,
            dayType: mockWeekdaySlot.dayType,
            price: 200000,
            isActive: true,
            description: mockWeekdaySlot.description,
          },
          {
            id: weekdaySlot2.id,
            name: weekdaySlot2.name,
            startTime: weekdaySlot2.startTime,
            endTime: weekdaySlot2.endTime,
            dayType: weekdaySlot2.dayType,
            price: 200000,
            isActive: true,
            description: weekdaySlot2.description,
          },
        ],
        weekendSlots: [
          {
            id: mockWeekendSlot.id,
            name: mockWeekendSlot.name,
            startTime: mockWeekendSlot.startTime,
            endTime: mockWeekendSlot.endTime,
            dayType: mockWeekendSlot.dayType,
            price: 300000,
            isActive: true,
            description: mockWeekendSlot.description,
          },
        ],
        pricing: {
          weekdayPrice: 200000,
          weekendPrice: 300000,
        },
      });

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should return empty arrays when no slots exist', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({
        weekdaySlots: [],
        weekendSlots: [],
        pricing: {
          weekdayPrice: 0,
          weekendPrice: 0,
        },
      });
    });

    it('should only include active slots', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockWeekdaySlot,
        mockWeekendSlot,
      ]);

      await service.findAll();

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should handle slots without description', async () => {
      const slotWithoutDesc = {
        ...mockWeekdaySlot,
        description: null,
      };
      mockPrismaService.timeSlot.findMany.mockResolvedValue([slotWithoutDesc]);

      const result = await service.findAll();

      expect(result.weekdaySlots[0].description).toBeUndefined();
    });

    it('should sort slots by start time', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockWeekdaySlot,
        mockWeekendSlot,
      ]);

      await service.findAll();

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should set pricing from first slot of each type', async () => {
      const weekdaySlot2 = {
        ...mockWeekdaySlot,
        id: '3',
        price: 250000, // Different price
      };
      const weekendSlot2 = {
        ...mockWeekendSlot,
        id: '4',
        price: 350000, // Different price
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockWeekdaySlot,
        weekdaySlot2,
        mockWeekendSlot,
        weekendSlot2,
      ]);

      const result = await service.findAll();

      // Should use price from first slot
      expect(result.pricing.weekdayPrice).toBe(200000);
      expect(result.pricing.weekendPrice).toBe(300000);
    });

    it('should convert Decimal price to number', async () => {
      const slotWithDecimal = {
        ...mockWeekdaySlot,
        price: { toString: () => '200000' }, // Simulate Prisma Decimal
      };
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        slotWithDecimal as any,
      ]);

      const result = await service.findAll();

      expect(typeof result.weekdaySlots[0].price).toBe('number');
      expect(result.weekdaySlots[0].price).toBe(200000);
    });
  });

  describe('findByDayType', () => {
    it('should return weekday slots only', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([mockWeekdaySlot]);

      const result = await service.findByDayType('WEEKDAY');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockWeekdaySlot.id,
        name: mockWeekdaySlot.name,
        startTime: mockWeekdaySlot.startTime,
        endTime: mockWeekdaySlot.endTime,
        dayType: 'WEEKDAY',
        price: 200000,
        isActive: true,
        description: mockWeekdaySlot.description,
      });

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          dayType: 'WEEKDAY',
        },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should return weekend slots only', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([mockWeekendSlot]);

      const result = await service.findByDayType('WEEKEND');

      expect(result).toHaveLength(1);
      expect(result[0].dayType).toBe('WEEKEND');
      expect(result[0].price).toBe(300000);

      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          dayType: 'WEEKEND',
        },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should return empty array when no slots match day type', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([]);

      const result = await service.findByDayType('WEEKDAY');

      expect(result).toEqual([]);
    });

    it('should handle slots without description', async () => {
      const slotWithoutDesc = {
        ...mockWeekdaySlot,
        description: null,
      };
      mockPrismaService.timeSlot.findMany.mockResolvedValue([slotWithoutDesc]);

      const result = await service.findByDayType('WEEKDAY');

      expect(result[0].description).toBeUndefined();
    });

    it('should return multiple slots sorted by start time', async () => {
      const slot1 = { ...mockWeekdaySlot, id: '1', startTime: '10:00' };
      const slot2 = { ...mockWeekdaySlot, id: '2', startTime: '08:00' };
      const slot3 = { ...mockWeekdaySlot, id: '3', startTime: '12:00' };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        slot1,
        slot2,
        slot3,
      ]);

      const result = await service.findByDayType('WEEKDAY');

      expect(result).toHaveLength(3);
      expect(mockPrismaService.timeSlot.findMany).toHaveBeenCalledWith({
        where: { isActive: true, dayType: 'WEEKDAY' },
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return time slot by ID', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockWeekdaySlot);

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: mockWeekdaySlot.id,
        name: mockWeekdaySlot.name,
        startTime: mockWeekdaySlot.startTime,
        endTime: mockWeekdaySlot.endTime,
        dayType: mockWeekdaySlot.dayType,
        price: 200000,
        isActive: true,
        description: mockWeekdaySlot.description,
      });

      expect(mockPrismaService.timeSlot.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if time slot not found', async () => {
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
      expect(mockPrismaService.timeSlot.findUnique).toHaveBeenCalledWith({
        where: { id: '999' },
      });
    });

    it('should handle slots without description', async () => {
      const slotWithoutDesc = {
        ...mockWeekdaySlot,
        description: null,
      };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(slotWithoutDesc);

      const result = await service.findOne('1');

      expect(result?.description).toBeUndefined();
    });

    it('should return inactive slots too (no filter by isActive)', async () => {
      const inactiveSlot = {
        ...mockWeekdaySlot,
        isActive: false,
      };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(inactiveSlot);

      const result = await service.findOne('1');

      expect(result).not.toBeNull();
      expect(result?.isActive).toBe(false);
    });

    it('should convert Decimal price to number', async () => {
      const slotWithDecimal = {
        ...mockWeekdaySlot,
        price: { toString: () => '200000' },
      };
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(
        slotWithDecimal as any,
      );

      const result = await service.findOne('1');

      expect(typeof result?.price).toBe('number');
      expect(result?.price).toBe(200000);
    });
  });
});

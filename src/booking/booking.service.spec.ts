import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PaymentMethodDto } from './dto/create-booking.dto';

describe('BookingService', () => {
  let service: BookingService;

  const mockTimeSlotWeekday = {
    id: 1,
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKDAY',
    price: 200000,
    isActive: true,
  };

  const mockTimeSlotWeekend = {
    id: 5,
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKEND',
    price: 300000,
    isActive: true,
  };

  const mockBooking = {
    id: 1,
    bookingCode: 'BKG-20260305-001',
    bookingGroupId: 'test-group-id',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '628123456789',
    customerNotes: null,
    bookingDate: new Date('2026-03-05'),
    timeSlotId: 1,
    totalHours: 2,
    totalPrice: 200000,
    paymentMethod: 'CASH',
    paymentStatus: 'UNPAID',
    status: 'PENDING',
    adminNotes: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    timeSlot: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string | number> = {
        'booking.minHours': 1,
        'booking.maxHours': 8,
        'booking.advanceDays': 30,
        'booking.cancellationHours': 24,
        'whatsapp.adminNumber': '628123456789',
      };
      return config[key];
    }),
  };

  const mockRedisService = {
    withLock: jest.fn((key: string, fn: () => Promise<any>) => fn()),
    incrementSequence: jest.fn(),
    expire: jest.fn(),
    getClient: jest.fn(() => ({
      ttl: jest.fn().mockResolvedValue(-1),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    // Reset Redis mock to pass through by default
    mockRedisService.withLock.mockImplementation(
      (key: string, fn: () => Promise<any>) => fn(),
    );
    mockRedisService.incrementSequence.mockResolvedValue(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validCreateDto = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '628123456789',
      bookingDate: '2026-03-05', // Wednesday (WEEKDAY)
      timeSlotIds: ['1'],
      paymentMethod: PaymentMethodDto.CASH,
    };

    it('should create a booking successfully with one time slot', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        } as Record<string, Record<string, jest.Mock>>) as Promise<
          typeof mockBooking
        >;
      });

      const result = await service.create(validCreateDto);

      expect(result).toBeDefined();
      expect(result.bookingCode).toMatch(/^BKG-\d{8}-\d{3}$/);
      expect(result.customerName).toBe(validCreateDto.customerName);
      expect(result.totalPrice).toBe(200000);
      expect(result.status).toBe('PENDING');
      expect(result.whatsappUrl).toContain('wa.me');
    });

    it('should create a booking with multiple time slots', async () => {
      const dtoWithMultipleSlots = {
        ...validCreateDto,
        timeSlotIds: ['1', '2', '3'],
      };

      const multipleSlots = [
        mockTimeSlotWeekday,
        { ...mockTimeSlotWeekday, id: 2, name: '10:00 - 12:00' },
        { ...mockTimeSlotWeekday, id: 3, name: '12:00 - 14:00' },
      ];

      mockPrismaService.timeSlot.findMany.mockResolvedValue(multipleSlots);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        } as Record<string, Record<string, jest.Mock>>) as Promise<
          typeof mockBooking
        >;
      });

      const result = await service.create(dtoWithMultipleSlots);

      expect(result.totalPrice).toBe(600000); // 3 slots × 200,000
      expect(result.totalHours).toBe(6); // 3 slots × 2 hours
      expect(result.timeSlots).toHaveLength(3);
    });

    it('should throw BadRequestException if date format is invalid', async () => {
      const invalidDto = {
        ...validCreateDto,
        bookingDate: 'invalid-date',
      };

      // No need to mock - date validation happens before DB calls
      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if date is in the past', async () => {
      const pastDto = {
        ...validCreateDto,
        bookingDate: '2020-01-01',
      };

      await expect(service.create(pastDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(pastDto)).rejects.toThrow(
        'Cannot book a date in the past',
      );
    });

    it('should throw BadRequestException if booking exceeds max advance days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 100);
      const farFutureDto = {
        ...validCreateDto,
        bookingDate: futureDate.toISOString().split('T')[0],
      };

      await expect(service.create(farFutureDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(farFutureDto)).rejects.toThrow(
        'Cannot book more than 30 days in advance',
      );
    });

    it('should throw BadRequestException if no time slots selected', async () => {
      const noSlotsDto = {
        ...validCreateDto,
        timeSlotIds: [],
      };

      await expect(service.create(noSlotsDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(noSlotsDto)).rejects.toThrow(
        'At least one time slot must be selected',
      );
    });

    it('should throw BadRequestException if exceeds maximum time slots', async () => {
      const tooManySlotsDto = {
        ...validCreateDto,
        timeSlotIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], // 9 slots, max is 8
      };

      await expect(service.create(tooManySlotsDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(tooManySlotsDto)).rejects.toThrow(
        'Maximum 8 time slots can be booked',
      );
    });

    it('should throw BadRequestException if time slot IDs are invalid', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([]); // No slots found

      await expect(service.create(validCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(validCreateDto)).rejects.toThrow(
        'One or more time slots are invalid',
      );
    });

    it('should throw BadRequestException if day type mismatch', async () => {
      const weekendDto = {
        ...validCreateDto,
        bookingDate: '2026-03-07', // Saturday
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday, // WEEKDAY slot for WEEKEND date
      ]);

      await expect(service.create(weekendDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(weekendDto)).rejects.toThrow(
        'Please select WEEKEND time slots',
      );
    });

    it('should throw ConflictException if time slots are already booked', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([
        {
          ...mockBooking,
          timeSlotId: 1,
        },
      ]);

      await expect(service.create(validCreateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(validCreateDto)).rejects.toThrow(
        'Time slots already booked',
      );
    });

    it('should calculate correct price for weekend booking', async () => {
      const weekendDto = {
        ...validCreateDto,
        bookingDate: '2026-03-07', // Saturday
        timeSlotIds: ['5'],
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekend,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        } as Record<string, Record<string, jest.Mock>>) as Promise<
          typeof mockBooking
        >;
      });

      const result = await service.create(weekendDto);

      expect(result.totalPrice).toBe(300000); // Weekend price
    });
  });

  describe('findByCode', () => {
    const bookingCode = 'BKG-20260305-001';

    it('should find booking by code successfully', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([
        {
          ...mockBooking,
          timeSlot: mockTimeSlotWeekday,
        },
      ]);

      const result = await service.findByCode(bookingCode);

      expect(result).toBeDefined();
      expect(result.bookingCode).toBe(bookingCode);
      expect(result.customerName).toBe(mockBooking.customerName);
      expect(result.timeSlots).toHaveLength(1);
      expect(result.whatsappUrl).toContain('wa.me');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await expect(service.findByCode(bookingCode)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByCode(bookingCode)).rejects.toThrow(
        'Booking not found',
      );
    });

    it('should return multiple time slots for multi-hour booking', async () => {
      const multipleBookings = [
        { ...mockBooking, id: 1, timeSlotId: 1, timeSlot: mockTimeSlotWeekday },
        {
          ...mockBooking,
          id: 2,
          timeSlotId: 2,
          timeSlot: { ...mockTimeSlotWeekday, id: 2, name: '10:00 - 12:00' },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(multipleBookings);

      const result = await service.findByCode(bookingCode);

      expect(result.timeSlots).toHaveLength(2);
    });
  });

  describe('checkAvailability', () => {
    const testDate = '2026-03-05'; // Wednesday

    it('should return available slots for a given date', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.checkAvailability(testDate);

      expect(result).toBeDefined();
      expect(result.date).toBe('2026-03-05');
      expect(result.dayType).toBe('WEEKDAY');
      expect(result.availableSlots).toHaveLength(1);
      expect(result.bookedSlotIds).toHaveLength(0);
    });

    it('should exclude booked slots from availability', async () => {
      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
        { ...mockTimeSlotWeekday, id: 2, name: '10:00 - 12:00' },
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([
        { timeSlotId: 1 }, // Slot 1 is booked
      ]);

      const result = await service.checkAvailability(testDate);

      expect(result.availableSlots).toHaveLength(1);
      expect(result.availableSlots[0].id).toBe(2);
      expect(result.bookedSlotIds).toContain(1);
    });

    it('should return weekend slots for weekend date', async () => {
      const weekendDate = '2026-03-07'; // Saturday

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekend,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.checkAvailability(weekendDate);

      expect(result.dayType).toBe('WEEKEND');
      expect(result.availableSlots[0].price).toBe(300000);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      // Mock to return empty slots so test proceeds to date validation
      mockPrismaService.timeSlot.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await expect(service.checkAvailability('invalid-date')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    const bookingCode = 'BKG-20260305-001';

    it('should cancel booking successfully when within time limit', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days in future

      const futureBooking = {
        ...mockBooking,
        bookingDate: futureDate,
        status: 'PENDING',
      };

      mockPrismaService.booking.findMany.mockResolvedValue([futureBooking]);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancel(bookingCode);

      expect(result).toBeDefined();
      expect(result.bookingCode).toBe(bookingCode);
      expect(result.status).toBe('CANCELLED');
      expect(result.message).toContain('successfully cancelled');
      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: { bookingCode },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await expect(service.cancel(bookingCode)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancel(bookingCode)).rejects.toThrow(
        'Booking not found',
      );
    });

    it('should throw BadRequestException if booking already cancelled', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'CANCELLED',
      };

      mockPrismaService.booking.findMany.mockResolvedValue([cancelledBooking]);

      await expect(service.cancel(bookingCode)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel(bookingCode)).rejects.toThrow(
        'already cancelled',
      );
    });

    it('should throw BadRequestException if booking is completed', async () => {
      const completedBooking = {
        ...mockBooking,
        status: 'COMPLETED',
      };

      mockPrismaService.booking.findMany.mockResolvedValue([completedBooking]);

      await expect(service.cancel(bookingCode)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel(bookingCode)).rejects.toThrow(
        'Cannot cancel completed booking',
      );
    });

    it('should throw BadRequestException if cancellation is too late', async () => {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      tomorrowDate.setHours(tomorrowDate.getHours() - 1); // 23 hours from now

      const nearFutureBooking = {
        ...mockBooking,
        bookingDate: tomorrowDate,
        status: 'PENDING',
      };

      mockPrismaService.booking.findMany.mockResolvedValue([nearFutureBooking]);

      await expect(service.cancel(bookingCode)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel(bookingCode)).rejects.toThrow(
        'at least 24 hours before',
      );
    });
  });

  describe('Redis-based sequence generation', () => {
    it('should use Redis INCR for atomic sequence generation', async () => {
      const validCreateDto = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '628123456789',
        bookingDate: '2026-03-05',
        timeSlotIds: [String(mockTimeSlotWeekday.id)],
        paymentMethod: 'CASH' as PaymentMethodDto,
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        } as Record<string, Record<string, jest.Mock>>) as Promise<
          typeof mockBooking
        >;
      });
      mockRedisService.incrementSequence.mockResolvedValue(1);

      await service.create(validCreateDto);

      expect(mockRedisService.incrementSequence).toHaveBeenCalledWith(
        'booking:seq:20260305',
      );
    });

    it('should use distributed lock to prevent race conditions', async () => {
      const validCreateDto = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '628123456789',
        bookingDate: '2026-03-05',
        timeSlotIds: [String(mockTimeSlotWeekday.id)],
        paymentMethod: 'CASH' as PaymentMethodDto,
      };

      mockPrismaService.timeSlot.findMany.mockResolvedValue([
        mockTimeSlotWeekday,
      ]);
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.$transaction.mockImplementation((callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        } as Record<string, Record<string, jest.Mock>>) as Promise<
          typeof mockBooking
        >;
      });

      await service.create(validCreateDto);

      expect(mockRedisService.withLock).toHaveBeenCalled();
      const lockKey = (mockRedisService.withLock as jest.Mock).mock.calls[0][0];
      expect(lockKey).toContain('booking:lock:2026-03-05');
    });
  });
});

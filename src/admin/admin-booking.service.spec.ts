import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminBookingService } from './admin-booking.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BookingStatusFilter,
  PaymentStatusFilter,
} from './dto/admin-query.dto';
import {
  BookingStatusUpdate,
  PaymentStatusUpdate,
} from './dto/update-booking.dto';

describe('AdminBookingService', () => {
  let service: AdminBookingService;

  const mockTimeSlot = {
    id: '1',
    name: '08:00 - 10:00',
    startTime: '08:00',
    endTime: '10:00',
    dayType: 'WEEKDAY' as any,
    price: 200000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBooking = {
    id: '1',
    bookingCode: 'BKG-20260305-001',
    bookingGroupId: 'group-uuid-123',
    customerName: 'John Doe',
    customerPhone: '081234567890',
    customerEmail: 'john@example.com',
    customerNotes: 'Please prepare the field',
    bookingDate: new Date('2026-03-05'),
    timeSlotId: '1',
    totalHours: 2,
    totalPrice: 200000,
    paymentMethod: 'CASH' as any,
    paymentStatus: 'UNPAID' as any,
    paymentNote: null,
    status: 'PENDING' as any,
    adminNote: null,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    confirmedAt: null,
    completedAt: null,
    cancelledAt: null,
    timeSlot: mockTimeSlot,
  };

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminBookingService>(AdminBookingService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated bookings with default pagination', async () => {
      const bookings = [mockBooking];
      mockPrismaService.booking.count.mockResolvedValue(1);
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: [
          {
            id: mockBooking.id,
            bookingCode: mockBooking.bookingCode,
            bookingGroupId: mockBooking.bookingGroupId,
            customerName: mockBooking.customerName,
            customerPhone: mockBooking.customerPhone,
            customerEmail: mockBooking.customerEmail,
            bookingDate: '2026-03-05',
            timeSlotName: mockTimeSlot.name,
            totalHours: 2,
            totalPrice: 200000,
            paymentMethod: mockBooking.paymentMethod,
            paymentStatus: mockBooking.paymentStatus,
            status: mockBooking.status,
            createdAt: mockBooking.createdAt,
            confirmedAt: undefined,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: {},
        include: { timeSlot: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by booking status', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ status: BookingStatusFilter.CONFIRMED });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: { status: 'CONFIRMED' },
      });
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { status: 'CONFIRMED' },
        include: { timeSlot: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by payment status', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ paymentStatus: PaymentStatusFilter.PAID });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: { paymentStatus: 'PAID' },
      });
    });

    it('should filter by booking date', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ bookingDate: '2026-03-05' });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: { bookingDate: new Date(2026, 2, 5) },
      });
    });

    it('should search by customer name, phone, or booking code', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ search: 'John' });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { customerName: { contains: 'John', mode: 'insensitive' } },
            { customerPhone: { contains: 'John' } },
            { bookingCode: { contains: 'John', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should handle custom pagination', async () => {
      mockPrismaService.booking.count.mockResolvedValue(25);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: {},
        include: { timeSlot: true },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('should not filter when status is ALL', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ status: BookingStatusFilter.ALL });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should not filter when payment status is ALL', async () => {
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      await service.findAll({ paymentStatus: PaymentStatusFilter.ALL });

      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should handle multiple bookings with same booking code (deduplicate)', async () => {
      const booking1 = { ...mockBooking, id: '1', timeSlotId: '1' };
      const booking2 = {
        ...mockBooking,
        id: '2',
        timeSlotId: '2',
        timeSlot: { ...mockTimeSlot, id: '2', name: '10:00 - 12:00' },
      };
      mockPrismaService.booking.count.mockResolvedValue(2);
      mockPrismaService.booking.findMany.mockResolvedValue([
        booking1,
        booking2,
      ]);

      const result = await service.findAll({});

      // Should only return one booking entry (deduplicated by booking code)
      expect(result.data).toHaveLength(1);
      expect(result.data[0].bookingCode).toBe('BKG-20260305-001');
    });
  });

  describe('findOne', () => {
    it('should return booking detail by ID', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([mockBooking]);

      const result = await service.findOne('1');

      expect(result).toEqual({
        id: mockBooking.id,
        bookingCode: mockBooking.bookingCode,
        bookingGroupId: mockBooking.bookingGroupId,
        customerName: mockBooking.customerName,
        customerPhone: mockBooking.customerPhone,
        customerEmail: mockBooking.customerEmail,
        customerNotes: mockBooking.customerNotes,
        bookingDate: '2026-03-05',
        timeSlots: [
          {
            id: mockTimeSlot.id,
            name: mockTimeSlot.name,
            startTime: mockTimeSlot.startTime,
            endTime: mockTimeSlot.endTime,
            price: mockTimeSlot.price,
          },
        ],
        totalHours: 2,
        totalPrice: 200000,
        paymentMethod: mockBooking.paymentMethod,
        paymentStatus: mockBooking.paymentStatus,
        paymentNote: undefined,
        status: mockBooking.status,
        adminNote: undefined,
        createdAt: mockBooking.createdAt,
        confirmedAt: undefined,
        completedAt: undefined,
        cancelledAt: undefined,
      });

      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { timeSlot: true },
      });
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { bookingCode: mockBooking.bookingCode },
        include: { timeSlot: true },
        orderBy: { timeSlot: { startTime: 'asc' } },
      });
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow('Booking not found');
    });

    it('should return multiple time slots for multi-hour booking', async () => {
      const timeSlot2 = {
        ...mockTimeSlot,
        id: '2',
        name: '10:00 - 12:00',
        startTime: '10:00',
        endTime: '12:00',
      };
      const booking2 = {
        ...mockBooking,
        id: '2',
        timeSlotId: '2',
        timeSlot: timeSlot2,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([
        mockBooking,
        booking2,
      ]);

      const result = await service.findOne('1');

      expect(result.timeSlots).toHaveLength(2);
      expect(result.timeSlots[0].name).toBe('08:00 - 10:00');
      expect(result.timeSlots[1].name).toBe('10:00 - 12:00');
    });
  });

  describe('updateStatus', () => {
    it('should update booking status to CONFIRMED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const updatedBooking = {
        ...mockBooking,
        status: 'CONFIRMED' as any,
        confirmedAt: new Date(),
      };
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(updatedBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([updatedBooking]);

      const result = await service.updateStatus('1', {
        status: BookingStatusUpdate.CONFIRMED,
        adminNote: 'Confirmed by admin',
      });

      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: { bookingCode: mockBooking.bookingCode },
        data: expect.objectContaining({
          status: BookingStatusUpdate.CONFIRMED,
          adminNote: 'Confirmed by admin',
          confirmedAt: expect.any(Date),
        }),
      });
      expect(result.status).toBe('CONFIRMED');
    });

    it('should update booking status to COMPLETED', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: 'CONFIRMED' as any,
        confirmedAt: new Date(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(confirmedBooking);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const completedBooking = {
        ...confirmedBooking,
        status: 'COMPLETED' as any,
        completedAt: new Date(),
      };
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(confirmedBooking)
        .mockResolvedValueOnce(completedBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([completedBooking]);

      const result = await service.updateStatus('1', {
        status: BookingStatusUpdate.COMPLETED,
      });

      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: { bookingCode: mockBooking.bookingCode },
        data: expect.objectContaining({
          status: BookingStatusUpdate.COMPLETED,
          completedAt: expect.any(Date),
        }),
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should update booking status to CANCELLED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const cancelledBooking = {
        ...mockBooking,
        status: 'CANCELLED' as any,
        cancelledAt: new Date(),
      };
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(cancelledBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([cancelledBooking]);

      const result = await service.updateStatus('1', {
        status: BookingStatusUpdate.CANCELLED,
        adminNote: 'Cancelled by customer request',
      });

      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: { bookingCode: mockBooking.bookingCode },
        data: expect.objectContaining({
          status: BookingStatusUpdate.CANCELLED,
          cancelledAt: expect.any(Date),
        }),
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('999', {
          status: BookingStatusUpdate.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updating cancelled booking', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'CANCELLED' as any,
        cancelledAt: new Date(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(cancelledBooking);

      await expect(
        service.updateStatus('1', {
          status: BookingStatusUpdate.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('1', {
          status: BookingStatusUpdate.CONFIRMED,
        }),
      ).rejects.toThrow('Cannot update a cancelled booking');
    });

    it('should throw BadRequestException if updating completed booking', async () => {
      const completedBooking = {
        ...mockBooking,
        status: 'COMPLETED' as any,
        completedAt: new Date(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(completedBooking);

      await expect(
        service.updateStatus('1', {
          status: BookingStatusUpdate.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus('1', {
          status: BookingStatusUpdate.CONFIRMED,
        }),
      ).rejects.toThrow('Cannot update a completed booking');
    });

    it('should not set confirmedAt if already set', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: 'CONFIRMED' as any,
        confirmedAt: new Date('2026-03-02'),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(confirmedBooking);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(confirmedBooking)
        .mockResolvedValueOnce(confirmedBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([confirmedBooking]);

      await service.updateStatus('1', {
        status: BookingStatusUpdate.CONFIRMED,
      });

      const updateCall = mockPrismaService.booking.updateMany.mock.calls[0][0];
      expect(updateCall.data.confirmedAt).toBeUndefined();
    });
  });

  describe('updatePayment', () => {
    it('should update payment status to PAID', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });

      const paidBooking = {
        ...mockBooking,
        paymentStatus: 'PAID' as any,
        paymentNote: 'Payment received',
      };
      mockPrismaService.booking.findUnique
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(paidBooking);
      mockPrismaService.booking.findMany.mockResolvedValue([paidBooking]);

      const result = await service.updatePayment('1', {
        paymentStatus: PaymentStatusUpdate.PAID,
        paymentNote: 'Payment received',
      });

      expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
        where: { bookingCode: mockBooking.bookingCode },
        data: {
          paymentStatus: PaymentStatusUpdate.PAID,
          paymentNote: 'Payment received',
        },
      });
      expect(result.paymentStatus).toBe('PAID');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePayment('999', {
          paymentStatus: PaymentStatusUpdate.PAID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is cancelled', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: 'CANCELLED' as any,
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(cancelledBooking);

      await expect(
        service.updatePayment('1', {
          paymentStatus: PaymentStatusUpdate.PAID,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updatePayment('1', {
          paymentStatus: PaymentStatusUpdate.PAID,
        }),
      ).rejects.toThrow('Cannot update payment for cancelled booking');
    });
  });

  describe('getStatistics', () => {
    it('should return dashboard statistics', async () => {
      // Mock booking counts
      mockPrismaService.booking.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(10) // confirmed
        .mockResolvedValueOnce(20) // completed
        .mockResolvedValueOnce(3) // cancelled
        .mockResolvedValueOnce(2); // today's bookings

      // Mock paid bookings for revenue
      mockPrismaService.booking.findMany
        .mockResolvedValueOnce([
          { totalPrice: 200000 },
          { totalPrice: 300000 },
          { totalPrice: 400000 },
        ])
        .mockResolvedValueOnce([
          { totalPrice: 200000 },
          { totalPrice: 200000 },
        ]);

      const result = await service.getStatistics();

      expect(result).toEqual({
        bookingsByStatus: {
          pending: 5,
          confirmed: 10,
          completed: 20,
          cancelled: 3,
          total: 38,
        },
        todayBookings: 2,
        revenue: {
          total: 900000, // 200k + 300k + 400k
          pending: 400000, // 200k + 200k
        },
      });

      expect(mockPrismaService.booking.count).toHaveBeenCalledTimes(5);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledTimes(2);
    });

    it('should handle zero bookings', async () => {
      mockPrismaService.booking.count
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0) // confirmed
        .mockResolvedValueOnce(0) // completed
        .mockResolvedValueOnce(0) // cancelled
        .mockResolvedValueOnce(0); // today's bookings

      mockPrismaService.booking.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getStatistics();

      expect(result).toEqual({
        bookingsByStatus: {
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          total: 0,
        },
        todayBookings: 0,
        revenue: {
          total: 0,
          pending: 0,
        },
      });
    });

    it('should calculate revenue correctly from Decimal values', async () => {
      mockPrismaService.booking.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      // Simulate Prisma Decimal values
      mockPrismaService.booking.findMany
        .mockResolvedValueOnce([
          { totalPrice: { toString: () => '250000' } }, // Decimal-like object
          { totalPrice: 150000 }, // Regular number
        ])
        .mockResolvedValueOnce([{ totalPrice: 100000 }]);

      const result = await service.getStatistics();

      expect(result.revenue.total).toBe(400000);
      expect(result.revenue.pending).toBe(100000);
    });
  });
});

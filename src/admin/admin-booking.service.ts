import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminBookingQueryDto,
  BookingStatusFilter,
  PaymentStatusFilter,
} from './dto/admin-query.dto';
import {
  UpdateBookingStatusDto,
  UpdatePaymentStatusDto,
} from './dto/update-booking.dto';
import {
  AdminBookingListResponseDto,
  AdminBookingDetailDto,
} from './dto/admin-booking-response.dto';
import { parseDateString, formatDateString } from '../common/utils/date.helper';

@Injectable()
export class AdminBookingService {
  constructor(private readonly prisma: PrismaService) {}

  //get all boking with pagination
  async findAll(
    query: AdminBookingQueryDto,
  ): Promise<AdminBookingListResponseDto> {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      bookingDate,
      search,
    } = query;
    const where: any = {};

    // filter by status
    if (status && status !== BookingStatusFilter.ALL) {
      where.status = status;
    }

    // filter by payment status
    if (paymentStatus && paymentStatus !== PaymentStatusFilter.ALL) {
      where.paymentStatus = paymentStatus;
    }

    // filter by booking date
    if (bookingDate) {
      const date = parseDateString(bookingDate);
      if (date) {
        where.bookingDate = date;
      }
    }

    // search by customer name, phone, or booking code
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { bookingCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // get total count
    const total = await this.prisma.booking.count({ where });

    // get paginated bookings (group by booking code to avoid duplicates)
    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        timeSlot: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // group by booking code to get unique bookings
    const uniqueBookingsMap = new Map();
    bookings.forEach((booking) => {
      if (!uniqueBookingsMap.has(booking.bookingCode)) {
        uniqueBookingsMap.set(booking.bookingCode, booking);
      }
    });

    const data = Array.from(uniqueBookingsMap.values()).map((booking) => ({
      id: booking.id,
      bookingCode: booking.bookingCode,
      bookingGroupId: booking.bookingGroupId || '',
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || undefined,
      bookingDate: formatDateString(booking.bookingDate as Date),
      timeSlotName: booking.timeSlot.name,
      totalHours: Number(booking.totalHours),
      totalPrice: Number(booking.totalPrice),
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt || undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // get one booking
  async findOne(id: string): Promise<AdminBookingDetailDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { timeSlot: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // get all bookings with the same booking code (multi-hour bookings)
    const allBookings = await this.prisma.booking.findMany({
      where: { bookingCode: booking.bookingCode },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startTime: 'asc' } },
    });

    const timeSlots = allBookings.map((b) => ({
      id: b.timeSlot.id,
      name: b.timeSlot.name,
      startTime: b.timeSlot.startTime,
      endTime: b.timeSlot.endTime,
      price: Number(b.timeSlot.price),
    }));

    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      bookingGroupId: booking.bookingGroupId || '',
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || undefined,
      customerNotes: booking.customerNotes || undefined,
      bookingDate: formatDateString(booking.bookingDate),
      timeSlots,
      totalHours: Number(booking.totalHours),
      totalPrice: Number(booking.totalPrice),
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      paymentNote: booking.paymentNote || undefined,
      status: booking.status,
      adminNote: booking.adminNote || undefined,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt || undefined,
      completedAt: booking.completedAt || undefined,
      cancelledAt: booking.cancelledAt || undefined,
    };
  }

  // update booking status
  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED' && dto.status !== ('CANCELLED' as any)) {
      throw new BadRequestException('Cannot update a cancelled booking');
    }

    if (booking.status === 'COMPLETED' && dto.status !== ('COMPLETED' as any)) {
      throw new BadRequestException('Cannot update a completed booking');
    }

    const updateData: any = {
      status: dto.status,
      adminNote: dto.adminNote,
    };

    const now = new Date();
    if (dto.status === ('CONFIRMED' as any) && !booking.confirmedAt) {
      updateData.confirmedAt = now;
    } else if (dto.status === ('COMPLETED' as any) && !booking.completedAt) {
      updateData.completedAt = now;
    } else if (dto.status === ('CANCELLED' as any) && !booking.cancelledAt) {
      updateData.cancelledAt = now;
    }

    await this.prisma.booking.updateMany({
      where: { bookingCode: booking.bookingCode },
      data: updateData,
    });

    return this.findOne(id);
  }

  // update payment status
  async updatePayment(id: string, dto: UpdatePaymentStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot update payment for cancelled booking',
      );
    }

    await this.prisma.booking.updateMany({
      where: { bookingCode: booking.bookingCode },
      data: {
        paymentStatus: dto.paymentStatus,
        paymentNote: dto.paymentNote,
      },
    });

    return this.findOne(id);
  }

  // get dashboard statistics
  async getStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // count bookings by status
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);

    // count today's bookings
    const todayBookings = await this.prisma.booking.count({
      where: {
        bookingDate: today,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // calculate total revenue (paid bookings only)
    const paidBookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
      },
      select: {
        totalPrice: true,
      },
    });

    const totalRevenue = paidBookings.reduce(
      (sum, booking) => sum + Number(booking.totalPrice),
      0,
    );

    // calculate pending revenue (unpaid confirmed bookings)
    const unpaidBookings = await this.prisma.booking.findMany({
      where: {
        paymentStatus: 'UNPAID',
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        totalPrice: true,
      },
    });

    const pendingRevenue = unpaidBookings.reduce(
      (sum, booking) => sum + Number(booking.totalPrice),
      0,
    );

    return {
      bookingsByStatus: {
        pending,
        confirmed,
        completed,
        cancelled,
        total: pending + confirmed + completed + cancelled,
      },
      todayBookings,
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
      },
    };
  }
}

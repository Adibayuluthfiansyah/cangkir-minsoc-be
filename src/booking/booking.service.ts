import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingResponseDto,
  AvailabilityResponseDto,
  CancelBookingResponseDto,
  TimeSlotDto,
} from './dto/booking-response.dto';
import { generateBookingCode } from '../common/utils/booking-code.generator';
import {
  parseDateString,
  isPast,
  isWeekend,
  addDays,
  formatDateString,
} from '../common/utils/date.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  // create booking
  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    const bookingDate = parseDateString(dto.bookingDate);
    if (!bookingDate) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (isPast(bookingDate)) {
      throw new BadRequestException('Cannot book a date in the past');
    }

    const maxAdvanceDays = this.config.get<number>('booking.advanceDays') || 30;
    const maxDate = addDays(new Date(), maxAdvanceDays);
    if (bookingDate > maxDate) {
      throw new BadRequestException(
        `Cannot book more than ${maxAdvanceDays} days in advance`,
      );
    }

    // check time slot availability
    if (dto.timeSlotIds.length === 0) {
      throw new BadRequestException('At least one time slot must be selected');
    }

    const maxHours = this.config.get<number>('booking.maxHours') || 8;
    if (dto.timeSlotIds.length > maxHours) {
      throw new BadRequestException(
        `Maximum ${maxHours} time slots can be booked`,
      );
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        id: { in: dto.timeSlotIds },
        isActive: true,
      },
    });

    if (timeSlots.length !== dto.timeSlotIds.length) {
      throw new BadRequestException('One or more time slots are invalid');
    }

    // check day type
    const isWeekendBooking = isWeekend(bookingDate);
    const expectedDayType = isWeekendBooking ? 'WEEKEND' : 'WEEKDAY';

    const invalidSlots = timeSlots.filter(
      (slot) => slot.dayType !== expectedDayType,
    );
    if (invalidSlots.length > 0) {
      throw new BadRequestException(
        `Selected date is a ${expectedDayType}. Please select ${expectedDayType} time slots`,
      );
    }

    //  distributed lock to prevent race conditions
    // const lockKey = `booking:lock:${dto.bookingDate}:${dto.timeSlotIds.sort().join(',')}`;
    const sortedIds = [...dto.timeSlotIds].sort();
    const lockKey = `booking:lock:${dto.bookingDate}:${sortedIds.join(',')}`;

    try {
      return await this.redis.withLock(
        lockKey,
        async () => {
          // Double-check availability inside lock
          const existingBookings = await this.prisma.booking.findMany({
            where: {
              bookingDate: bookingDate,
              timeSlotId: { in: dto.timeSlotIds },
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          });

          if (existingBookings.length > 0) {
            const bookedSlotIds = existingBookings.map((b) => b.timeSlotId);
            const bookedSlotNames = timeSlots
              .filter((s) => bookedSlotIds.includes(s.id))
              .map((s) => s.name);
            throw new ConflictException(
              `Time slots already booked: ${bookedSlotNames.join(', ')}`,
            );
          }

          // calculate price
          const totalPrice = timeSlots.reduce(
            (sum, slot) => sum + Number(slot.price),
            0,
          );
          const totalHours = timeSlots.length * 2;

          // get atomic sequence from redis
          const dateStr = formatDateString(bookingDate).replace(/-/g, '');
          const sequenceKey = `booking:seq:${dateStr}`;
          const sequence = await this.redis.incrementSequence(sequenceKey);

          // set expiry for sequence key (2 days to be safe)
          const ttl = await this.redis
            .getClient()
            .ttl(sequenceKey)
            .catch(() => -1);
          if (ttl === -1) {
            // key has no expiry, set it to expire at end of next day
            const now = new Date();
            const endOfNextDay = new Date(now);
            endOfNextDay.setDate(endOfNextDay.getDate() + 2);
            endOfNextDay.setHours(23, 59, 59, 999);
            const secondsUntilExpiry = Math.floor(
              (endOfNextDay.getTime() - now.getTime()) / 1000,
            );
            await this.redis.expire(sequenceKey, secondsUntilExpiry);
          }

          const bookingCode = generateBookingCode(sequence, bookingDate);
          const bookingGroupId = crypto.randomUUID();

          // create booking in transaction
          let firstBooking;
          try {
            await this.prisma.$transaction(async (tx) => {
              for (const slot of timeSlots) {
                const booking = await tx.booking.create({
                  data: {
                    bookingCode,
                    bookingGroupId,
                    customerName: dto.customerName,
                    customerEmail: dto.customerEmail,
                    customerPhone: dto.customerPhone,
                    customerNotes: dto.customerNotes,
                    bookingDate: bookingDate,
                    timeSlotId: slot.id,
                    totalHours: new Prisma.Decimal(totalHours),
                    totalPrice: new Prisma.Decimal(totalPrice),
                    paymentMethod: dto.paymentMethod as any,
                    status: 'PENDING',
                  },
                });
                if (!firstBooking) {
                  firstBooking = booking;
                }
              }
            });

            const whatsappNumber =
              this.config.get<string>('whatsapp.adminNumber') || '628123456789';
            const whatsappMessage = encodeURIComponent(
              `Halo admin, saya ingin konfirmasi booking dengan kode: ${bookingCode}\n\n` +
                `Nama: ${dto.customerName}\n` +
                `Tanggal: ${formatDateString(bookingDate)}\n` +
                `Jam: ${timeSlots.map((s) => s.name).join(', ')}\n` +
                `Total: Rp ${totalPrice.toLocaleString('id-ID')}`,
            );

            return {
              bookingCode,
              bookingGroupId,
              customerName: dto.customerName,
              customerEmail: dto.customerEmail,
              customerPhone: dto.customerPhone,
              bookingDate: formatDateString(bookingDate),
              totalHours,
              totalPrice,
              paymentMethod: dto.paymentMethod,
              paymentStatus: 'UNPAID',
              status: 'PENDING',
              timeSlots: timeSlots.map((slot) => ({
                id: slot.id,
                name: slot.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                dayType: slot.dayType,
                price: Number(slot.price),
              })),
              whatsappUrl: `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`,
              createdAt: firstBooking?.createdAt || new Date(),
            };
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2002') {
                throw new ConflictException(
                  'One or more time slots are already booked',
                );
              }
            }
            throw new InternalServerErrorException('Failed to create booking');
          }
        },
        30,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.message?.includes('Failed to acquire lock')) {
        throw new ConflictException(
          'Too many concurrent bookings. Please try again in a moment.',
        );
      }
      throw new InternalServerErrorException('Failed to create booking');
    }
  }

  // find booking by code id
  async findByCode(bookingCode: string): Promise<BookingResponseDto> {
    const bookings = await this.prisma.booking.findMany({
      where: { bookingCode },
      include: { timeSlot: true },
      orderBy: { timeSlot: { startTime: 'asc' } },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Booking not found');
    }

    const firstBooking = bookings[0];
    const timeSlots: TimeSlotDto[] = bookings.map((b) => ({
      id: b.timeSlot.id,
      name: b.timeSlot.name,
      startTime: b.timeSlot.startTime,
      endTime: b.timeSlot.endTime,
      dayType: b.timeSlot.dayType,
      price: Number(b.timeSlot.price),
    }));

    const whatsappNumber =
      this.config.get<string>('whatsapp.adminNumber') || '628123456789';
    const whatsappMessage = encodeURIComponent(
      `Halo admin, saya ingin tanya tentang booking dengan kode: ${bookingCode}`,
    );

    return {
      bookingCode: firstBooking.bookingCode,
      bookingGroupId: firstBooking.bookingGroupId || '',
      customerName: firstBooking.customerName,
      customerEmail: firstBooking.customerEmail || undefined,
      customerPhone: firstBooking.customerPhone,
      bookingDate: formatDateString(firstBooking.bookingDate),
      totalHours: Number(firstBooking.totalHours),
      totalPrice: Number(firstBooking.totalPrice),
      paymentMethod: firstBooking.paymentMethod,
      paymentStatus: firstBooking.paymentStatus,
      status: firstBooking.status,
      timeSlots,
      whatsappUrl: `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`,
      createdAt: firstBooking.createdAt,
    };
  }

  // check availability date
  async checkAvailability(
    date: string,
    timeSlotIds?: string[],
  ): Promise<AvailabilityResponseDto> {
    const bookingDate = parseDateString(date);
    if (!bookingDate) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const isWeekendDate = isWeekend(bookingDate);
    const dayType = isWeekendDate ? 'WEEKEND' : 'WEEKDAY';

    const whereClause: any = {
      isActive: true,
      dayType,
    };

    if (timeSlotIds && timeSlotIds.length > 0) {
      whereClause.id = { in: timeSlotIds };
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
    });

    // get booked slots for this date
    const bookedSlots = await this.prisma.booking.findMany({
      where: {
        bookingDate: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { timeSlotId: true },
    });

    const bookedSlotIds = bookedSlots.map((b) => b.timeSlotId);
    const availableSlots = timeSlots
      .filter((slot) => !bookedSlotIds.includes(slot.id))
      .map((slot) => ({
        id: slot.id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayType: slot.dayType,
        price: Number(slot.price),
      }));

    return {
      date: formatDateString(bookingDate),
      dayType,
      availableSlots,
      bookedSlotIds,
    };
  }

  // cancel booking
  async cancel(bookingCode: string): Promise<CancelBookingResponseDto> {
    const bookings = await this.prisma.booking.findMany({
      where: { bookingCode },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Booking not found');
    }

    const firstBooking = bookings[0];

    // check if booking can be cancelled
    if (firstBooking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (firstBooking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // check cancellation time limit
    const cancellationHours =
      this.config.get<number>('booking.cancellationHours') || 24;
    const bookingDateTime = new Date(firstBooking.bookingDate);
    const minCancellationTime = addDays(
      bookingDateTime,
      -cancellationHours / 24,
    );

    if (new Date() > minCancellationTime) {
      throw new BadRequestException(
        `Booking can only be cancelled at least ${cancellationHours} hours before the booking date`,
      );
    }

    // update all bookings with this code to CANCELLED
    const now = new Date();
    await this.prisma.booking.updateMany({
      where: { bookingCode },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
      },
    });

    return {
      bookingCode,
      status: 'CANCELLED',
      cancelledAt: now,
      message: 'Booking successfully cancelled',
    };
  }
}

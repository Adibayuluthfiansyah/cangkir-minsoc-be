import { ApiProperty } from '@nestjs/swagger';

export class BookingTimeSlotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Pagi 09:00 - 11:00' })
  name: string;

  @ApiProperty({ example: '09:00' })
  startTime: string;

  @ApiProperty({ example: '11:00' })
  endTime: string;

  @ApiProperty({ example: 'WEEKDAY', enum: ['WEEKDAY', 'WEEKEND'] })
  dayType: string;

  @ApiProperty({ example: 200000 })
  price: number;
}

export class BookingResponseDto {
  @ApiProperty({ example: 'BKG-20260315-001' })
  bookingCode: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  bookingGroupId: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  customerEmail?: string;

  @ApiProperty({ example: '628123456789' })
  customerPhone: string;

  @ApiProperty({ example: '2026-03-15' })
  bookingDate: string;

  @ApiProperty({ example: 2, description: 'Total hours booked' })
  totalHours: number;

  @ApiProperty({ example: 400000, description: 'Total price in IDR' })
  totalPrice: number;

  @ApiProperty({ example: 'CASH', enum: ['CASH', 'TRANSFER'] })
  paymentMethod: string;

  @ApiProperty({ example: 'UNPAID', enum: ['UNPAID', 'PAID'] })
  paymentStatus: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    type: [BookingTimeSlotDto],
    description: 'Array of booked time slots',
  })
  timeSlots: BookingTimeSlotDto[];

  @ApiProperty({
    example:
      'https://wa.me/628123456789?text=Halo%20admin%2C%20saya%20ingin%20konfirmasi%20booking%20dengan%20kode%3A%20BKG-20260315-001',
  })
  whatsappUrl: string;

  @ApiProperty({ example: '2026-03-01T10:30:00.000Z' })
  createdAt: Date;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '2026-03-15' })
  date: string;

  @ApiProperty({ example: 'WEEKDAY', enum: ['WEEKDAY', 'WEEKEND'] })
  dayType: string;

  @ApiProperty({
    type: [BookingTimeSlotDto],
    description: 'Array of available time slots',
  })
  availableSlots: BookingTimeSlotDto[];

  @ApiProperty({
    type: [String],
    description: 'Array of booked time slot IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  bookedSlotIds: string[];
}

export class CancelBookingResponseDto {
  @ApiProperty({ example: 'BKG-20260315-001' })
  bookingCode: string;

  @ApiProperty({ example: 'CANCELLED' })
  status: string;

  @ApiProperty({ example: '2026-03-01T15:45:00.000Z' })
  cancelledAt: Date;

  @ApiProperty({ example: 'Booking successfully cancelled' })
  message: string;
}

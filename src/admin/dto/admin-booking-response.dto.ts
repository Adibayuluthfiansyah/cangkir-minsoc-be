import { ApiProperty } from '@nestjs/swagger';

export class AdminBookingItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'BKG-20260315-001' })
  bookingCode: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  bookingGroupId: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: '628123456789' })
  customerPhone: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  customerEmail?: string;

  @ApiProperty({ example: '2026-03-15' })
  bookingDate: string;

  @ApiProperty({ example: 'Pagi 09:00 - 11:00' })
  timeSlotName: string;

  @ApiProperty({ example: 2 })
  totalHours: number;

  @ApiProperty({ example: 400000 })
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

  @ApiProperty({ example: '2026-03-01T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-02T14:20:00.000Z', required: false })
  confirmedAt?: Date;
}

export class AdminBookingListResponseDto {
  @ApiProperty({ type: [AdminBookingItemDto] })
  data: AdminBookingItemDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 50,
      totalPages: 5,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminBookingDetailDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'BKG-20260315-001' })
  bookingCode: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  bookingGroupId: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: '628123456789' })
  customerPhone: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  customerEmail?: string;

  @ApiProperty({ example: 'Please prepare the field earlier', required: false })
  customerNotes?: string;

  @ApiProperty({ example: '2026-03-15' })
  bookingDate: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        price: { type: 'number' },
      },
    },
  })
  timeSlots: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    price: number;
  }>;

  @ApiProperty({ example: 2 })
  totalHours: number;

  @ApiProperty({ example: 400000 })
  totalPrice: number;

  @ApiProperty({ example: 'CASH', enum: ['CASH', 'TRANSFER'] })
  paymentMethod: string;

  @ApiProperty({ example: 'UNPAID', enum: ['UNPAID', 'PAID'] })
  paymentStatus: string;

  @ApiProperty({ example: 'Payment received via transfer', required: false })
  paymentNote?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ example: 'Customer confirmed via WhatsApp', required: false })
  adminNote?: string;

  @ApiProperty({ example: '2026-03-01T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-02T14:20:00.000Z', required: false })
  confirmedAt?: Date;

  @ApiProperty({ example: '2026-03-15T18:00:00.000Z', required: false })
  completedAt?: Date;

  @ApiProperty({ example: '2026-03-01T15:45:00.000Z', required: false })
  cancelledAt?: Date;
}

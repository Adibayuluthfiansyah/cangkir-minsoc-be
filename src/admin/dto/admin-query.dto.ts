import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BookingStatusFilter {
  ALL = 'ALL',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatusFilter {
  ALL = 'ALL',
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export class AdminBookingQueryDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatusFilter,
    required: false,
    default: BookingStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(BookingStatusFilter)
  status?: BookingStatusFilter = BookingStatusFilter.ALL;

  @ApiProperty({
    description: 'Filter by payment status',
    enum: PaymentStatusFilter,
    required: false,
    default: PaymentStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  paymentStatus?: PaymentStatusFilter = PaymentStatusFilter.ALL;

  @ApiProperty({
    description: 'Filter by booking date (YYYY-MM-DD)',
    example: '2026-03-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  bookingDate?: string;

  @ApiProperty({
    description: 'Search by customer name, phone, or booking code',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  search?: string;
}

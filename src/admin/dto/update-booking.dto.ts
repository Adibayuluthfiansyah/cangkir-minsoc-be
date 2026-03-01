import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum BookingStatusUpdate {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatusUpdate {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'New booking status',
    enum: BookingStatusUpdate,
    example: BookingStatusUpdate.CONFIRMED,
  })
  @IsEnum(BookingStatusUpdate)
  status: BookingStatusUpdate;

  @ApiProperty({
    description: 'Admin note (optional)',
    example: 'Customer confirmed via WhatsApp',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatusUpdate,
    example: PaymentStatusUpdate.PAID,
  })
  @IsEnum(PaymentStatusUpdate)
  paymentStatus: PaymentStatusUpdate;

  @ApiProperty({
    description: 'Payment note (optional)',
    example: 'Payment received via bank transfer',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentNote?: string;
}

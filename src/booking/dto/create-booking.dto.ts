import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsDateString,
  IsArray,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export enum PaymentMethodDto {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  customerName: string;

  @ApiProperty({
    description: 'Customer email address (optional)',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({
    description: 'Customer phone number (Indonesian format)',
    example: '628123456789',
    pattern: '^(\\+?62|0)[0-9]{9,13}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+?62|0)[0-9]{9,13}$/, {
    message: 'Phone number must be valid Indonesian format',
  })
  customerPhone: string;

  @ApiProperty({
    description: 'Booking date in YYYY-MM-DD format',
    example: '2026-03-15',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  bookingDate: string;

  @ApiProperty({
    description: 'Array of time slot IDs (UUIDs) for multi-hour booking',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
    minItems: 1,
    maxItems: 8,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 time slot must be selected' })
  @ArrayMaxSize(8, { message: 'Maximum 8 time slots can be booked' })
  @IsString({ each: true })
  timeSlotIds: string[];

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodDto,
    example: PaymentMethodDto.TRANSFER,
  })
  @IsEnum(PaymentMethodDto)
  @IsNotEmpty()
  paymentMethod: PaymentMethodDto;

  @ApiProperty({
    description: 'Additional notes from customer (optional)',
    example: 'Please prepare the field 15 minutes earlier',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  customerNotes?: string;
}

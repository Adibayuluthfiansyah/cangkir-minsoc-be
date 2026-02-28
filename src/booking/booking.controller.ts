import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/query-booking.dto';
import {
  BookingResponseDto,
  AvailabilityResponseDto,
  CancelBookingResponseDto,
} from './dto/booking-response.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new booking',
    description:
      'Create a new field booking with customer details and selected time slots. ' +
      'Returns booking code and WhatsApp link to contact admin.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking successfully created',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input (past date, invalid time slots, exceeds max hours, etc.)',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot book a date in the past',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'One or more time slots are already booked',
    schema: {
      example: {
        statusCode: 409,
        message: 'Time slots already booked: Pagi 09:00 - 11:00',
        error: 'Conflict',
      },
    },
  })
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check time slot availability',
    description:
      'Check which time slots are available for a specific date. ' +
      'Optionally filter by specific time slot IDs.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to check (YYYY-MM-DD)',
    example: '2026-03-15',
  })
  @ApiQuery({
    name: 'timeSlotIds',
    required: false,
    description: 'Comma-separated time slot IDs to check (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability information retrieved successfully',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format',
  })
  checkAvailability(@Query() query: CheckAvailabilityDto) {
    const timeSlotIds = query.timeSlotIds
      ? query.timeSlotIds.split(',').map((id) => id.trim())
      : undefined;
    return this.bookingService.checkAvailability(query.date, timeSlotIds);
  }

  @Get(':bookingCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get booking by code',
    description:
      'Retrieve booking details using the booking code (format: BKG-YYYYMMDD-XXX)',
  })
  @ApiParam({
    name: 'bookingCode',
    description: 'Booking code',
    example: 'BKG-20260315-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking found',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Booking not found',
        error: 'Not Found',
      },
    },
  })
  findByCode(@Param('bookingCode') bookingCode: string) {
    return this.bookingService.findByCode(bookingCode);
  }

  @Post(':bookingCode/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Cancel a booking by booking code. ' +
      'Booking can only be cancelled if status is PENDING or CONFIRMED, ' +
      'and must be cancelled at least 24 hours before booking date.',
  })
  @ApiParam({
    name: 'bookingCode',
    description: 'Booking code to cancel',
    example: 'BKG-20260315-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking successfully cancelled',
    type: CancelBookingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Booking cannot be cancelled (already cancelled, completed, or too close to booking date)',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Booking can only be cancelled at least 24 hours before the booking date',
        error: 'Bad Request',
      },
    },
  })
  cancel(@Param('bookingCode') bookingCode: string) {
    return this.bookingService.cancel(bookingCode);
  }
}

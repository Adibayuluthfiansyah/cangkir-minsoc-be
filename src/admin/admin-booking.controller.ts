import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminBookingService } from './admin-booking.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { AdminBookingQueryDto } from './dto/admin-query.dto';
import {
  UpdateBookingStatusDto,
  UpdatePaymentStatusDto,
} from './dto/update-booking.dto';
import {
  AdminBookingListResponseDto,
  AdminBookingDetailDto,
} from './dto/admin-booking-response.dto';

@ApiTags('Admin Bookings')
@Controller('admin/bookings')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth('JWT-auth')
export class AdminBookingController {
  constructor(private readonly bookingService: AdminBookingService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all bookings',
    description:
      'Get paginated list of bookings with filters (status, payment, date, search)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bookings retrieved successfully',
    type: AdminBookingListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  findAll(@Query() query: AdminBookingQueryDto) {
    return this.bookingService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Get statistics for dashboard: bookings by status, today bookings, revenue',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        bookingsByStatus: {
          pending: 5,
          confirmed: 10,
          completed: 20,
          cancelled: 3,
          total: 38,
        },
        todayBookings: 2,
        revenue: {
          total: 5000000,
          pending: 800000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  getStatistics() {
    return this.bookingService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking detail',
    description: 'Get detailed booking information by booking ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking detail retrieved successfully',
    type: AdminBookingDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update booking status',
    description:
      'Update booking status (PENDING → CONFIRMED → COMPLETED or CANCELLED)',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Booking status updated successfully',
    type: AdminBookingDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingService.updateStatus(id, dto);
  }

  @Patch(':id/payment')
  @ApiOperation({
    summary: 'Update payment status',
    description: 'Update payment status and add payment note',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment status updated successfully',
    type: AdminBookingDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update payment for cancelled booking',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.bookingService.updatePayment(id, dto);
  }
}

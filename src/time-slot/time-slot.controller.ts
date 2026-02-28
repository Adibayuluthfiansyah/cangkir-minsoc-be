import {
  Controller,
  Get,
  Param,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TimeSlotService } from './time-slot.service';
import {
  TimeSlotListResponseDto,
  TimeSlotDto,
} from './dto/time-slot-response.dto';

@ApiTags('Time Slots')
@Controller('time-slots')
export class TimeSlotController {
  constructor(private readonly timeSlotService: TimeSlotService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all time slots',
    description: 'Get all active time slots grouped by weekday and weekend',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slots retrieved successfully',
    type: TimeSlotListResponseDto,
  })
  findAll() {
    return this.timeSlotService.findAll();
  }

  @Get('by-day-type/:dayType')
  @ApiOperation({
    summary: 'Get time slots by day type',
    description: 'Get all active time slots filtered by WEEKDAY or WEEKEND',
  })
  @ApiParam({
    name: 'dayType',
    enum: ['WEEKDAY', 'WEEKEND'],
    description: 'Day type filter',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slots retrieved successfully',
    type: [TimeSlotDto],
  })
  findByDayType(@Param('dayType') dayType: 'WEEKDAY' | 'WEEKEND') {
    return this.timeSlotService.findByDayType(dayType);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get time slot by ID',
    description: 'Get single time slot details by UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Time slot UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slot found',
    type: TimeSlotDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Time slot not found',
  })
  async findOne(@Param('id') id: string) {
    const timeSlot = await this.timeSlotService.findOne(id);
    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }
    return timeSlot;
  }
}

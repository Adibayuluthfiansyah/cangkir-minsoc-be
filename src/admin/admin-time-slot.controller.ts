import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
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
import { AdminTimeSlotService } from './admin-time-slot.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CreateTimeSlotDto } from './dto/time-slot/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/time-slot/update-time-slot.dto';

@ApiTags('Admin Time Slots')
@Controller('admin/time-slots')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth('JWT-auth')
export class AdminTimeSlotController {
  constructor(private readonly timeSlotService: AdminTimeSlotService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all time slots',
    description: 'Get all time slots including inactive ones (admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slots retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing JWT token',
  })
  findAll() {
    return this.timeSlotService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get time slot by ID',
    description: 'Get single time slot details',
  })
  @ApiParam({
    name: 'id',
    description: 'Time slot UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slot found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Time slot not found',
  })
  findOne(@Param('id') id: string) {
    return this.timeSlotService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new time slot',
    description: 'Create a new time slot with validation for overlapping times',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Time slot created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or time validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Time slot overlaps with existing slot',
  })
  create(@Body() createTimeSlotDto: CreateTimeSlotDto) {
    return this.timeSlotService.create(createTimeSlotDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update time slot',
    description: 'Update time slot with overlap validation',
  })
  @ApiParam({
    name: 'id',
    description: 'Time slot UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slot updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Time slot not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Time slot overlaps with existing slot',
  })
  update(
    @Param('id') id: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    return this.timeSlotService.update(id, updateTimeSlotDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Toggle time slot active status',
    description: 'Activate or deactivate a time slot',
  })
  @ApiParam({
    name: 'id',
    description: 'Time slot UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slot status toggled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Time slot not found',
  })
  toggleActive(@Param('id') id: string) {
    return this.timeSlotService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete time slot',
    description: 'Delete time slot (only if no active bookings)',
  })
  @ApiParam({
    name: 'id',
    description: 'Time slot UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Time slot deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Time slot not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete time slot with active bookings',
  })
  remove(@Param('id') id: string) {
    return this.timeSlotService.remove(id);
  }
}

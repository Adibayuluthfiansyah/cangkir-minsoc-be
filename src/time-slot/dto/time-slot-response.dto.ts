import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotDto {
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

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'Weekday slot 09:00 - 11:00', required: false })
  description?: string;
}

export class TimeSlotListResponseDto {
  @ApiProperty({ type: [TimeSlotDto] })
  weekdaySlots: TimeSlotDto[];

  @ApiProperty({ type: [TimeSlotDto] })
  weekendSlots: TimeSlotDto[];

  @ApiProperty({
    example: {
      weekdayPrice: 200000,
      weekendPrice: 300000,
    },
  })
  pricing: {
    weekdayPrice: number;
    weekendPrice: number;
  };
}

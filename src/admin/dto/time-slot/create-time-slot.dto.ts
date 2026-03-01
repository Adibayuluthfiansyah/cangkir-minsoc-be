import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export enum DayTypeEnum {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
}

export class CreateTimeSlotDto {
  @ApiProperty({
    description: 'Time slot name',
    example: 'Pagi 09:00 - 11:00',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Start time (HH:MM format)',
    example: '09:00',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:MM format)',
    example: '11:00',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;

  @ApiProperty({
    description: 'Day type',
    enum: DayTypeEnum,
    example: DayTypeEnum.WEEKDAY,
  })
  @IsEnum(DayTypeEnum)
  dayType: DayTypeEnum;

  @ApiProperty({
    description: 'Price in IDR',
    example: 200000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Is this slot active?',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Time slot description',
    example: 'Weekday morning slot',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

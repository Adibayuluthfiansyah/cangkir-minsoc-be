import { ApiProperty } from '@nestjs/swagger';
import { Matches, IsNotEmpty, IsOptional } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Date to check availability (YYYY-MM-DD)',
    example: '2026-03-15',
    format: 'date',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Comma-separated time slot IDs to check (optional)',
    example:
      '123e4567-e89b-12d3-a456-426614174000,987e6543-e21c-34f5-b678-123456789abc',
    required: false,
  })
  @IsOptional()
  timeSlotIds?: string;
}

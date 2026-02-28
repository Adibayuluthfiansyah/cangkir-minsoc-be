import { format } from 'date-fns';

export function generateBookingCode(
  sequenceNumber: number,
  date: Date = new Date(),
): string {
  const dateStr = format(date, 'yyyyMMdd');
  const seqStr = sequenceNumber.toString().padStart(3, '0');
  return `BKG-${dateStr}-${seqStr}`;
}

export function parseBookingCode(bookingCode: string): {
  date: string;
  sequence: number;
} | null {
  const pattern = /^BKG-(\d{8})-(\d{3})$/;
  const match = bookingCode.match(pattern);

  if (!match) {
    return null;
  }

  return {
    date: match[1],
    sequence: parseInt(match[2], 10),
  };
}

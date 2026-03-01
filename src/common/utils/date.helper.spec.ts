import {
  isWeekend,
  isWeekday,
  addDays,
  getToday,
  isPast,
  isToday,
  parseDateString,
  formatDateString,
} from './date.helper';

describe('date.helper', () => {
  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2026-02-28'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2026-03-01'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for Monday', () => {
      const monday = new Date('2026-03-02'); // Monday
      expect(isWeekend(monday)).toBe(false);
    });

    it('should return false for Friday', () => {
      const friday = new Date('2026-03-06'); // Friday
      expect(isWeekend(friday)).toBe(false);
    });

    it('should return false for weekdays', () => {
      const tuesday = new Date('2026-03-03'); // Tuesday
      const wednesday = new Date('2026-03-04'); // Wednesday
      const thursday = new Date('2026-03-05'); // Thursday

      expect(isWeekend(tuesday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
      expect(isWeekend(thursday)).toBe(false);
    });
  });

  describe('isWeekday', () => {
    it('should return true for Monday', () => {
      const monday = new Date('2026-03-02'); // Monday
      expect(isWeekday(monday)).toBe(true);
    });

    it('should return true for Friday', () => {
      const friday = new Date('2026-03-06'); // Friday
      expect(isWeekday(friday)).toBe(true);
    });

    it('should return false for Saturday', () => {
      const saturday = new Date('2026-02-28'); // Saturday
      expect(isWeekday(saturday)).toBe(false);
    });

    it('should return false for Sunday', () => {
      const sunday = new Date('2026-03-01'); // Sunday
      expect(isWeekday(sunday)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2026-03-01');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getFullYear()).toBe(2026);
    });

    it('should subtract days with negative number', () => {
      const date = new Date('2026-03-10');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(5);
      expect(result.getMonth()).toBe(2); // March
    });

    it('should handle month boundaries', () => {
      const date = new Date('2026-03-30');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(3); // April
    });

    it('should handle year boundaries', () => {
      const date = new Date('2026-12-30');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2027);
    });

    it('should handle adding 0 days', () => {
      const date = new Date('2026-03-01');
      const result = addDays(date, 0);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2);
    });
  });

  describe('getToday', () => {
    it('should return today with time set to 00:00:00', () => {
      const today = getToday();
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
      expect(today.getMilliseconds()).toBe(0);
    });

    it('should return current date', () => {
      const today = getToday();
      const now = new Date();
      expect(today.getDate()).toBe(now.getDate());
      expect(today.getMonth()).toBe(now.getMonth());
      expect(today.getFullYear()).toBe(now.getFullYear());
    });
  });

  describe('isPast', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      expect(isPast(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = getToday();
      expect(isPast(today)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expect(isPast(tomorrow)).toBe(false);
    });

    it('should return true for dates in the past', () => {
      const pastDate = new Date('2025-01-01');
      expect(isPast(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2027-12-31');
      expect(isPast(futureDate)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for current date', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);
    });

    it('should return true for current date with different time', () => {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      expect(isToday(now)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('parseDateString', () => {
    it('should parse valid date string YYYY-MM-DD', () => {
      const result = parseDateString('2026-03-15');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(15);
    });

    it('should parse date with single digit month and day', () => {
      const result = parseDateString('2026-3-5');
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getDate()).toBe(5);
    });

    it('should return null for invalid format (missing parts)', () => {
      expect(parseDateString('2026-03')).toBeNull();
      expect(parseDateString('2026')).toBeNull();
    });

    it('should return null for invalid format (too many parts)', () => {
      expect(parseDateString('2026-03-15-01')).toBeNull();
    });

    it('should return null for non-numeric values', () => {
      expect(parseDateString('2026-abc-15')).toBeNull();
      expect(parseDateString('abc-03-15')).toBeNull();
      expect(parseDateString('2026-03-xyz')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDateString('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseDateString(null as unknown as string)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseDateString(undefined as unknown as string)).toBeNull();
    });

    it('should return null for invalid date (Feb 31)', () => {
      expect(parseDateString('2026-02-31')).toBeNull();
    });

    it('should return null for invalid date (Apr 31)', () => {
      expect(parseDateString('2026-04-31')).toBeNull();
    });

    it('should return null for month 13', () => {
      expect(parseDateString('2026-13-01')).toBeNull();
    });

    it('should return null for month 0', () => {
      expect(parseDateString('2026-00-01')).toBeNull();
    });

    it('should return null for day 0', () => {
      expect(parseDateString('2026-03-00')).toBeNull();
    });

    it('should return null for day 32', () => {
      expect(parseDateString('2026-03-32')).toBeNull();
    });

    it('should handle leap year (Feb 29)', () => {
      const result = parseDateString('2024-02-29'); // 2024 is leap year
      expect(result).not.toBeNull();
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(29);
    });

    it('should return null for Feb 29 in non-leap year', () => {
      expect(parseDateString('2026-02-29')).toBeNull(); // 2026 is not leap year
    });

    it('should handle different date separators (only - supported)', () => {
      expect(parseDateString('2026/03/15')).toBeNull();
      expect(parseDateString('2026.03.15')).toBeNull();
    });

    it('should return null for invalid-date string', () => {
      expect(parseDateString('invalid-date')).toBeNull();
    });

    it('should return null for negative numbers', () => {
      expect(parseDateString('2026-03--15')).toBeNull();
      expect(parseDateString('-2026-03-15')).toBeNull();
    });
  });

  describe('formatDateString', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2026-03-15');
      expect(formatDateString(date)).toBe('2026-03-15');
    });

    it('should pad single digit month', () => {
      const date = new Date('2026-01-15');
      expect(formatDateString(date)).toBe('2026-01-15');
    });

    it('should pad single digit day', () => {
      const date = new Date('2026-03-05');
      expect(formatDateString(date)).toBe('2026-03-05');
    });

    it('should handle first day of year', () => {
      const date = new Date('2026-01-01');
      expect(formatDateString(date)).toBe('2026-01-01');
    });

    it('should handle last day of year', () => {
      const date = new Date('2026-12-31');
      expect(formatDateString(date)).toBe('2026-12-31');
    });

    it('should handle dates with time components', () => {
      const date = new Date('2026-03-15T14:30:45.123Z');
      const formatted = formatDateString(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseDateString and formatDateString roundtrip', () => {
    it('should be reversible for valid dates', () => {
      const dateString = '2026-03-15';
      const parsed = parseDateString(dateString);
      const formatted = formatDateString(parsed!);
      expect(formatted).toBe(dateString);
    });

    it('should be reversible for dates with padding', () => {
      const dateString = '2026-01-05';
      const parsed = parseDateString(dateString);
      const formatted = formatDateString(parsed!);
      expect(formatted).toBe(dateString);
    });

    it('should normalize dates without padding', () => {
      const dateString = '2026-1-5';
      const parsed = parseDateString(dateString);
      const formatted = formatDateString(parsed!);
      expect(formatted).toBe('2026-01-05'); // Should add padding
    });
  });

  describe('edge cases', () => {
    it('should handle Date objects at different times of day', () => {
      const morning = new Date('2026-03-15T01:00:00Z');
      const evening = new Date('2026-03-15T23:00:00Z');

      const morningFormatted = formatDateString(morning);
      const eveningFormatted = formatDateString(evening);

      // Both should format to same date string (ignoring time)
      expect(morningFormatted).toMatch(/2026-03-\d{2}/);
      expect(eveningFormatted).toMatch(/2026-03-\d{2}/);
    });

    it('should handle century boundaries', () => {
      const date = new Date('2099-12-31');
      expect(formatDateString(date)).toBe('2099-12-31');
    });

    it('should handle year 2000', () => {
      const date = new Date('2000-01-01');
      expect(formatDateString(date)).toBe('2000-01-01');
    });
  });
});

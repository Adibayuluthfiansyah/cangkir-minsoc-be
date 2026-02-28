import {
  generateBookingCode,
  parseBookingCode,
} from './booking-code.generator';

describe('booking-code.generator', () => {
  describe('generateBookingCode', () => {
    it('should generate booking code with correct format BKG-YYYYMMDD-XXX', () => {
      const date = new Date('2026-03-15');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20260315-001');
    });

    it('should pad sequence number to 3 digits', () => {
      const date = new Date('2026-03-15');
      expect(generateBookingCode(1, date)).toBe('BKG-20260315-001');
      expect(generateBookingCode(10, date)).toBe('BKG-20260315-010');
      expect(generateBookingCode(100, date)).toBe('BKG-20260315-100');
    });

    it('should handle large sequence numbers', () => {
      const date = new Date('2026-03-15');
      expect(generateBookingCode(999, date)).toBe('BKG-20260315-999');
      expect(generateBookingCode(1000, date)).toBe('BKG-20260315-1000');
    });

    it('should handle sequence number 0', () => {
      const date = new Date('2026-03-15');
      expect(generateBookingCode(0, date)).toBe('BKG-20260315-000');
    });

    it('should format date correctly for single digit month', () => {
      const date = new Date('2026-01-15');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20260115-001');
    });

    it('should format date correctly for single digit day', () => {
      const date = new Date('2026-03-05');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20260305-001');
    });

    it('should use current date when date not provided', () => {
      const code = generateBookingCode(1);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedPrefix = `BKG-${year}${month}${day}`;
      expect(code).toMatch(new RegExp(`^${expectedPrefix}-\\d{3}$`));
    });

    it('should generate different codes for different dates', () => {
      const date1 = new Date('2026-03-15');
      const date2 = new Date('2026-03-16');
      const code1 = generateBookingCode(1, date1);
      const code2 = generateBookingCode(1, date2);
      expect(code1).not.toBe(code2);
      expect(code1).toBe('BKG-20260315-001');
      expect(code2).toBe('BKG-20260316-001');
    });

    it('should generate different codes for different sequences', () => {
      const date = new Date('2026-03-15');
      const code1 = generateBookingCode(1, date);
      const code2 = generateBookingCode(2, date);
      const code3 = generateBookingCode(3, date);
      expect(code1).toBe('BKG-20260315-001');
      expect(code2).toBe('BKG-20260315-002');
      expect(code3).toBe('BKG-20260315-003');
    });

    it('should handle year boundaries', () => {
      const date = new Date('2026-12-31');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20261231-001');
    });

    it('should handle first day of year', () => {
      const date = new Date('2026-01-01');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20260101-001');
    });

    it('should handle leap year date', () => {
      const date = new Date('2024-02-29');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20240229-001');
    });

    it('should handle century boundaries', () => {
      const date = new Date('2099-12-31');
      const code = generateBookingCode(1, date);
      expect(code).toBe('BKG-20991231-001');
    });

    it('should maintain format consistency', () => {
      const date = new Date('2026-03-15');
      for (let i = 1; i <= 100; i++) {
        const code = generateBookingCode(i, date);
        expect(code).toMatch(/^BKG-\d{8}-\d{3,}$/);
      }
    });
  });

  describe('parseBookingCode', () => {
    it('should parse valid booking code', () => {
      const result = parseBookingCode('BKG-20260315-001');
      expect(result).toEqual({
        date: '20260315',
        sequence: 1,
      });
    });

    it('should parse booking code with different sequence numbers', () => {
      expect(parseBookingCode('BKG-20260315-010')).toEqual({
        date: '20260315',
        sequence: 10,
      });
      expect(parseBookingCode('BKG-20260315-100')).toEqual({
        date: '20260315',
        sequence: 100,
      });
      expect(parseBookingCode('BKG-20260315-999')).toEqual({
        date: '20260315',
        sequence: 999,
      });
    });

    it('should parse booking code with sequence 000', () => {
      const result = parseBookingCode('BKG-20260315-000');
      expect(result).toEqual({
        date: '20260315',
        sequence: 0,
      });
    });

    it('should parse booking code with 4-digit sequence', () => {
      const result = parseBookingCode('BKG-20260315-1000');
      expect(result).toBeNull(); // Only 3-digit sequences are valid
    });

    it('should return null for invalid format (missing prefix)', () => {
      expect(parseBookingCode('20260315-001')).toBeNull();
    });

    it('should return null for invalid format (wrong prefix)', () => {
      expect(parseBookingCode('BOOK-20260315-001')).toBeNull();
    });

    it('should return null for invalid format (missing date)', () => {
      expect(parseBookingCode('BKG--001')).toBeNull();
    });

    it('should return null for invalid format (missing sequence)', () => {
      expect(parseBookingCode('BKG-20260315-')).toBeNull();
    });

    it('should return null for invalid format (short date)', () => {
      expect(parseBookingCode('BKG-2026031-001')).toBeNull();
    });

    it('should return null for invalid format (long date)', () => {
      expect(parseBookingCode('BKG-202603151-001')).toBeNull();
    });

    it('should return null for invalid format (short sequence)', () => {
      expect(parseBookingCode('BKG-20260315-01')).toBeNull();
    });

    it('should return null for invalid format (no separators)', () => {
      expect(parseBookingCode('BKG20260315001')).toBeNull();
    });

    it('should return null for invalid format (wrong separator)', () => {
      expect(parseBookingCode('BKG_20260315_001')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseBookingCode('')).toBeNull();
    });

    it('should return null for random string', () => {
      expect(parseBookingCode('random-string')).toBeNull();
    });

    // Note: parseBookingCode expects string input, null/undefined handling not needed
    // as TypeScript will catch this at compile time

    it('should return null for lowercase prefix', () => {
      expect(parseBookingCode('bkg-20260315-001')).toBeNull();
    });

    it('should return null for partial match', () => {
      expect(parseBookingCode('BKG-20260315-001-extra')).toBeNull();
    });

    it('should parse different dates correctly', () => {
      expect(parseBookingCode('BKG-20260101-001')).toEqual({
        date: '20260101',
        sequence: 1,
      });
      expect(parseBookingCode('BKG-20261231-999')).toEqual({
        date: '20261231',
        sequence: 999,
      });
    });

    it('should return null for non-numeric date', () => {
      expect(parseBookingCode('BKG-abcd0315-001')).toBeNull();
    });

    it('should return null for non-numeric sequence', () => {
      expect(parseBookingCode('BKG-20260315-abc')).toBeNull();
    });
  });

  describe('generateBookingCode and parseBookingCode roundtrip', () => {
    it('should be reversible for valid codes', () => {
      const date = new Date('2026-03-15');
      const code = generateBookingCode(123, date);
      const parsed = parseBookingCode(code);

      expect(parsed).not.toBeNull();
      expect(parsed?.date).toBe('20260315');
      expect(parsed?.sequence).toBe(123);
    });

    it('should be reversible for different sequences', () => {
      const date = new Date('2026-03-15');
      for (let seq = 1; seq <= 100; seq++) {
        const code = generateBookingCode(seq, date);
        const parsed = parseBookingCode(code);
        expect(parsed?.sequence).toBe(seq);
      }
    });

    it('should be reversible for different dates', () => {
      const dates = [
        new Date('2026-01-01'),
        new Date('2026-06-15'),
        new Date('2026-12-31'),
      ];

      dates.forEach((date) => {
        const code = generateBookingCode(1, date);
        const parsed = parseBookingCode(code);
        expect(parsed).not.toBeNull();

        // Verify date matches
        const year = date.getFullYear().toString();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        expect(parsed?.date).toBe(`${year}${month}${day}`);
      });
    });

    it('should reconstruct the original code', () => {
      const date = new Date('2026-03-15');
      const sequence = 42;
      const code = generateBookingCode(sequence, date);
      const parsed = parseBookingCode(code);

      // Reconstruct
      const reconstructed = generateBookingCode(
        parsed!.sequence,
        new Date(
          parseInt(parsed!.date.substring(0, 4)),
          parseInt(parsed!.date.substring(4, 6)) - 1,
          parseInt(parsed!.date.substring(6, 8)),
        ),
      );

      expect(reconstructed).toBe(code);
    });
  });

  describe('edge cases', () => {
    it('should handle very large sequence numbers', () => {
      const date = new Date('2026-03-15');
      const code = generateBookingCode(9999, date);
      expect(code).toBe('BKG-20260315-9999');

      // parseBookingCode will fail because it expects exactly 3 digits
      expect(parseBookingCode(code)).toBeNull();
    });

    it('should handle negative sequence numbers', () => {
      const date = new Date('2026-03-15');
      const code = generateBookingCode(-1, date);
      // This will create an invalid code, but generator doesn't validate
      expect(code).toContain('BKG-20260315-');
    });

    it('should handle dates with time components', () => {
      const date = new Date('2026-03-15T14:30:45.123Z');
      const code = generateBookingCode(1, date);
      // Should only use date part, ignoring time
      expect(code).toMatch(/^BKG-20260315-001$/);
    });
  });

  describe('format specification', () => {
    it('should always have BKG prefix', () => {
      const code = generateBookingCode(1, new Date('2026-03-15'));
      expect(code).toMatch(/^BKG-/);
    });

    it('should always have 8-digit date', () => {
      const code = generateBookingCode(1, new Date('2026-03-15'));
      expect(code).toMatch(/^BKG-\d{8}-/);
    });

    it('should always have at least 3-digit sequence', () => {
      const code = generateBookingCode(1, new Date('2026-03-15'));
      expect(code).toMatch(/-\d{3}$/);
    });

    it('should use hyphens as separators', () => {
      const code = generateBookingCode(1, new Date('2026-03-15'));
      const parts = code.split('-');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('BKG');
      expect(parts[1]).toHaveLength(8);
      expect(parts[2]).toHaveLength(3);
    });
  });
});

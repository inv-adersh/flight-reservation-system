import { describe, it, expect } from 'vitest';
import { formatCurrency, INR, fmtTime, fmtDate, diffHM } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency and INR', () => {
    it('returns empty string for invalid, null, or undefined inputs', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency('invalid')).toBe('');
      expect(formatCurrency(NaN)).toBe('');
    });

    it('formats INR numbers correctly', () => {
      expect(INR(5000)).toMatch(/₹\s?5,000/);
      expect(INR(1250.5)).toMatch(/₹\s?1,250\.50/);
    });

    it('formats various currency codes with correct locale', () => {
      expect(formatCurrency(100, 'USD')).toMatch(/\$\s?100\.00/);
      expect(formatCurrency(1000, 'JPY')).toContain('1,000');
      expect(formatCurrency(50.25, 'EUR')).toContain('50');
    });

    it('handles unknown currency codes with fallback locale', () => {
      expect(formatCurrency(250, 'XYZ')).toContain('250');
    });
  });

  describe('fmtTime', () => {
    it('returns empty string for falsy inputs', () => {
      expect(fmtTime(null)).toBe('');
      expect(fmtTime('')).toBe('');
    });

    it('formats valid ISO strings to HH:mm time format', () => {
      const iso = '2026-09-20T14:30:00Z';
      const formatted = fmtTime(iso);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('fmtDate', () => {
    it('returns empty string for falsy inputs', () => {
      expect(fmtDate(null)).toBe('');
      expect(fmtDate('')).toBe('');
    });

    it('formats valid ISO strings to localized date format', () => {
      const iso = '2026-09-20T14:30:00Z';
      const formatted = fmtDate(iso);
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Sep');
    });
  });

  describe('diffHM', () => {
    it('returns N/A if departure or arrival dates are missing or invalid', () => {
      expect(diffHM(null, '2026-09-20T12:00:00Z')).toBe('N/A');
      expect(diffHM('2026-09-20T10:00:00Z', null)).toBe('N/A');
      expect(diffHM('invalid', 'invalid')).toBe('N/A');
    });

    it('calculates the duration difference in hours and minutes', () => {
      const dep = '2026-09-20T10:00:00Z';
      const arr = '2026-09-20T12:45:00Z';
      expect(diffHM(dep, arr)).toBe('2h 45m');
    });

    it('handles overnight flight durations correctly', () => {
      const dep = '2026-09-20T23:30:00Z';
      const arr = '2026-09-21T03:15:00Z';
      expect(diffHM(dep, arr)).toBe('3h 45m');
    });
  });
});

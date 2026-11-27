import { describe, expect, it } from 'vitest';
import { formatPhone, isResidentUid, isValidPhone, maskPhone, normalizePhone, residentIdFor } from './phone.js';

describe('normalizePhone', () => {
  it('accepts the common ways people type a PH mobile', () => {
    for (const input of ['09171234567', '0917 123 4567', '0917-123-4567', '9171234567', '639171234567', '+63 917 123 4567', '(0917) 123 4567']) {
      expect(normalizePhone(input)).toBe('+639171234567');
    }
  });

  it('rejects landlines, short numbers and other countries', () => {
    for (const input of ['', null, '(043) 702-3902', '0917123456', '091712345678', '+1 415 555 0100', '08171234567', 'abc']) {
      expect(normalizePhone(input)).toBeNull();
      expect(isValidPhone(input)).toBe(false);
    }
  });
});

describe('display helpers', () => {
  it('formats and masks for people', () => {
    expect(formatPhone('+639171234567')).toBe('0917 123 4567');
    expect(maskPhone('+639171234567')).toBe('0917 ••• 4567');
    expect(maskPhone('not a number')).toBe('');
  });
});

describe('residentIdFor', () => {
  it('gives the same account id however the number is typed', () => {
    expect(residentIdFor('0917 123 4567')).toBe('ph_639171234567');
    expect(residentIdFor('+639171234567')).toBe('ph_639171234567');
    expect(residentIdFor('12345')).toBeNull();
    expect(isResidentUid('ph_639171234567')).toBe(true);
    expect(isResidentUid('2V2BWfoXkKeoXt8T8FMhe5iIgSH3')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  AIRPORT_MAP,
  registerAirports,
  getAirportInfo,
  resolveAirport,
} from '../airportHelpers';

describe('airportHelpers — getAirportInfo & registerAirports', () => {
  it('returns default unknown airport info when input is falsy', () => {
    expect(getAirportInfo(null)).toEqual({
      city: 'Unknown',
      code: '---',
      name: 'Airport',
      country: '',
    });
    expect(getAirportInfo('')).toEqual({
      city: 'Unknown',
      code: '---',
      name: 'Airport',
      country: '',
    });
  });

  it('retrieves airport info by IATA code from AIRPORT_MAP', () => {
    const info = getAirportInfo('DEL');
    expect(info.city).toBe('New Delhi');
    expect(info.country).toBe('India');

    // Case-insensitive lookup
    const lowerInfo = getAirportInfo('del');
    expect(lowerInfo.city).toBe('New Delhi');
  });

  it('searches airport info by city name or airport name', () => {
    const byCity = getAirportInfo('New Delhi');
    expect(byCity.code).toBe('DEL');

    const byName = getAirportInfo('Chhatrapati Shivaji');
    expect(byName.code).toBe('BOM');
  });

  it('falls back to formatted code object if no match is found', () => {
    const fallback = getAirportInfo('QQQ');
    expect(fallback).toEqual({
      city: 'QQQ',
      code: 'QQQ',
      name: 'QQQ Airport',
      country: '',
    });
  });

  it('registers new airports dynamically via registerAirports', () => {
    registerAirports([
      { code: 'BOD', city: 'Bordeaux', name: 'Bordeaux Airport', country: 'France' },
    ]);

    const info = getAirportInfo('BOD');
    expect(info).toEqual({
      city: 'Bordeaux',
      code: 'BOD',
      name: 'Bordeaux Airport',
      country: 'France',
    });
  });

  it('ignores invalid inputs in registerAirports', () => {
    expect(registerAirports(null)).toBeUndefined();
    expect(registerAirports('not-an-array')).toBeUndefined();
  });
});

describe('airportHelpers — resolveAirport', () => {
  it('returns null for empty or invalid query', () => {
    expect(resolveAirport(null)).toBeNull();
    expect(resolveAirport('   ')).toBeNull();
  });

  it('resolves by direct code match in AIRPORT_MAP', () => {
    const res = resolveAirport('DXB');
    expect(res.city).toBe('Dubai');
  });

  it('resolves by direct code match in provided airports list', () => {
    const customAirports = [{ code: 'BER', city: 'Berlin', name: 'Berlin Brandenburg', country: 'Germany' }];
    const res = resolveAirport('BER', customAirports);
    expect(res.city).toBe('Berlin');
    expect(res.code).toBe('BER');
  });

  it('resolves by exact city match', () => {
    const res = resolveAirport('Tokyo');
    expect(res.code).toBe('HND');
  });

  it('resolves by exact name match', () => {
    const res = resolveAirport('Changi Airport');
    expect(res.code).toBe('SIN');
  });

  it('resolves by prefix match (starts with city or code)', () => {
    const customAirports = [{ iata_code: 'ZRH', city: 'Zurich', airport_name: 'Zurich Airport', country_name: 'Switzerland' }];
    const res = resolveAirport('Zur', customAirports);
    expect(res.code).toBe('ZRH');
    expect(res.city).toBe('Zurich');
  });

  it('resolves by substring match in code, city, or name', () => {
    const customAirports = [{ code: 'FCO', city: 'Rome', name: 'Leonardo da Vinci-Fiumicino' }];
    const res = resolveAirport('vinci', customAirports);
    expect(res.code).toBe('FCO');
    expect(res.city).toBe('Rome');
  });

  it('falls back to 3-letter IATA code format object for unknown 3-letter query', () => {
    const res = resolveAirport('QWE');
    expect(res).toEqual({
      code: 'QWE',
      city: 'QWE',
      name: 'QWE Airport',
      country: '',
    });
  });

  it('returns null for arbitrary unmatched non-3-letter string', () => {
    expect(resolveAirport('unmatched-random-string')).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flightsAPI } from '../flightService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  API_BASE_URL: '/api',
  fetchWithAuth: vi.fn(),
  getResponseData: vi.fn(),
}));

describe('flightsAPI.getNearestAirport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchWithAuth with correct endpoint and coordinates', async () => {
    const mockAirport = {
      id: 1,
      iata_code: 'DEL',
      airport_name: 'Indira Gandhi International Airport',
      city: 'New Delhi',
      distance_km: 8.42,
    };
    apiClient.fetchWithAuth.mockResolvedValueOnce(mockAirport);

    const lat = 28.6139;
    const lng = 77.209;
    const result = await flightsAPI.getNearestAirport(lat, lng);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      `/flights/v2/airports/nearest/?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      {}
    );
    expect(result).toEqual(mockAirport);
  });

  it('passes custom options (e.g. AbortSignal) to fetchWithAuth', async () => {
    apiClient.fetchWithAuth.mockResolvedValueOnce({});
    const controller = new AbortController();
    const options = { signal: controller.signal };

    await flightsAPI.getNearestAirport(12.9716, 77.5946, options);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/v2/airports/nearest/?lat=12.9716&lng=77.5946',
      options
    );
  });
});
describe('flightsAPI.retrieve', () => {
  it('calls fetchWithAuth with the correct flight ID', async () => {
    const mockFlight = { id: 10, flight_number: 'AI101' };

    apiClient.fetchWithAuth.mockResolvedValueOnce(mockFlight);

    const result = await flightsAPI.retrieve(10);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/10/'
    );

    expect(result).toEqual(mockFlight);
  });
});

describe('flightsAPI.getSeats', () => {
  it('calls fetchWithAuth with the correct flight instance ID', async () => {
    await flightsAPI.getSeats(25);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/v2/seats/?flight_instance=25'
    );
  });
});

describe('flightsAPI.getMeals', () => {
  it('calls fetchWithAuth with cabin class', async () => {
    await flightsAPI.getMeals(25, {
      cabin_class: 'BUSINESS',
    });

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/25/meals/?cabin_class=BUSINESS'
    );
  });
});
describe('flightsAPI.getAirports', () => {
  it('builds the query string with all supported parameters', async () => {
    await flightsAPI.getAirports({
      page_size: 20,
      q: 'Delhi',
      search: 'airport',
    });

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/v2/airports/?page_size=20&q=Delhi&search=airport',
      {}
    );
  });

  it('calls the endpoint without query parameters when params are empty', async () => {
    await flightsAPI.getAirports();

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/flights/v2/airports/',
      {}
    );
  });
});

describe('flightsAPI.getFarePrediction', () => {
  it('uses the provided cabin class', async () => {
    await flightsAPI.getFarePrediction(100, 'BUSINESS');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/fare-prediction/100/?cabin_class=BUSINESS'
    );
  });

  it('uses ECONOMY as the default cabin class', async () => {
    await flightsAPI.getFarePrediction(100);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/fare-prediction/100/?cabin_class=ECONOMY'
    );
  });
});

describe('flightsAPI.list', () => {
  it('builds the query string with all supported parameters', async () => {
    await flightsAPI.list(2, {
      search: 'Air India',
      status: 'ACTIVE',
      source: 'CCJ',
      destination: 'DEL',
      date: '2026-09-20',
      arrival_date: '2026-09-21',
      ordering: 'fare',
      min_fare: 1000,
      max_fare: 5000,
      stops: 0,
      airlines: ['Air India', 'IndiGo'],
      waitlist_mode: 'available_only',
      cabin_class: 'ECONOMY',
      passengers: 2,
      page_size: 20,
    });

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining('/flights/?'),
      {}
    );

    const calledUrl = apiClient.fetchWithAuth.mock.calls[0][0];

    const query = new URLSearchParams(calledUrl.split('?')[1]);

    expect(query.get('page')).toBe('2');
    expect(query.get('search')).toBe('Air India');
    expect(query.get('status')).toBe('ACTIVE');
    expect(query.get('source')).toBe('CCJ');
    expect(query.get('destination')).toBe('DEL');
    expect(query.get('date')).toBe('2026-09-20');
    expect(query.get('arrival_date')).toBe('2026-09-21');
    expect(query.get('ordering')).toBe('fare');
    expect(query.get('min_fare')).toBe('1000');
    expect(query.get('max_fare')).toBe('5000');
    expect(query.get('stops')).toBe('0');
    expect(query.get('airlines')).toBe('Air India,IndiGo');
    expect(query.get('waitlist_mode')).toBe('available_only');
    expect(query.get('cabin_class')).toBe('ECONOMY');
    expect(query.get('passengers')).toBe('2');
    expect(query.get('page_size')).toBe('20');
  });
});

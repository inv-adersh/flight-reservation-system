import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flightsAPI } from '../flightService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  API_BASE_URL: '/api',
  fetchWithAuth: vi.fn(),
  getResponseData: vi.fn(),
}));

describe('flightsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNearestAirport', () => {
    it('calls fetchWithAuth with correct endpoint and coordinates', async () => {
      const mockAirport = { id: 1, iata_code: 'DEL', city: 'New Delhi' };
      apiClient.fetchWithAuth.mockResolvedValueOnce(mockAirport);

      const lat = 28.6139;
      const lng = 77.209;
      const result = await flightsAPI.getNearestAirport(lat, lng);

      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
        `/flights/v2/airports/nearest/?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
        {}
      );
      expect(result).toEqual(mockAirport);
    });

    it('passes custom options to fetchWithAuth', async () => {
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

  describe('retrieve, seats, meals, airports, farePrediction', () => {
    it('retrieves flight details by ID', async () => {
      const mockFlight = { id: 10, flight_number: 'AI101' };
      apiClient.fetchWithAuth.mockResolvedValueOnce(mockFlight);

      const result = await flightsAPI.retrieve(10);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/10/');
      expect(result).toEqual(mockFlight);
    });

    it('gets seats for flight instance', async () => {
      await flightsAPI.getSeats(25);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/seats/?flight_instance=25');
    });

    it('gets meals with cabin class option', async () => {
      await flightsAPI.getMeals(25, { cabin_class: 'BUSINESS' });
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/25/meals/?cabin_class=BUSINESS');
    });

    it('gets airports with parameters', async () => {
      await flightsAPI.getAirports({ page_size: 20, q: 'Delhi' });
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/airports/?page_size=20&q=Delhi', {});
    });

    it('gets airports without parameters', async () => {
      await flightsAPI.getAirports();
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/airports/', {});
    });

    it('gets fare prediction with cabin class', async () => {
      await flightsAPI.getFarePrediction(100, 'BUSINESS');
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/fare-prediction/100/?cabin_class=BUSINESS');
    });

    it('gets fare prediction default cabin class', async () => {
      await flightsAPI.getFarePrediction(100);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/fare-prediction/100/?cabin_class=ECONOMY');
    });
  });

  describe('list', () => {
    it('builds query string with all parameters', async () => {
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

  describe('CRUD operations & endpoints', () => {
    it('creates a flight', async () => {
      const payload = { flight_number: 'AI202' };
      apiClient.fetchWithAuth.mockResolvedValueOnce({ id: 1, ...payload });

      const res = await flightsAPI.create(payload);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(res.id).toBe(1);
    });

    it('updates a flight', async () => {
      const payload = { flight_number: 'AI202-UPD' };
      await flightsAPI.update(1, payload);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/1/', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    });

    it('patches a flight', async () => {
      const payload = { status: 'CANCELLED' };
      await flightsAPI.patch(1, payload);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/1/', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    });

    it('deletes a flight', async () => {
      await flightsAPI.delete(1);
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/1/', {
        method: 'DELETE',
      });
    });

    it('fetches bounds', async () => {
      await flightsAPI.getBounds({ source: 'JFK' });
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/bounds/?source=JFK', {});
    });

    it('fetches calendar', async () => {
      await flightsAPI.getCalendar({ month: '2026-09' });
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/calendar/?month=2026-09', {});
    });

    it('fetches stats', async () => {
      await flightsAPI.stats();
      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/flights/v2/stats/');
    });
  });
});

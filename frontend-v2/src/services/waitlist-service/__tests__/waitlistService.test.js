import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitlistAPI } from '../waitlistService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  fetchWithAuth: vi.fn(),
}));

describe('waitlistAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('join calls POST /waitlist/join/ with flight, cabin_class, and passengers', async () => {
    const mockRes = { id: 1, status: 'WAITING' };
    apiClient.fetchWithAuth.mockResolvedValueOnce(mockRes);

    const passengers = [{ name: 'Jane Doe' }];
    const result = await waitlistAPI.join(10, passengers, 'FIRST');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/join/', {
      method: 'POST',
      body: JSON.stringify({
        flight: 10,
        cabin_class: 'FIRST',
        passengers,
      }),
    });
    expect(result).toEqual(mockRes);
  });

  it('list handles flightId parameter when present and absent', async () => {
    await waitlistAPI.list(10);
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/?flight=10');

    await waitlistAPI.list();
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/');
  });

  it('retrieve calls GET /waitlist/:id/', async () => {
    await waitlistAPI.retrieve(7);
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/7/');
  });

  it('cancel calls POST /waitlist/:id/cancel/', async () => {
    await waitlistAPI.cancel(7);
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/7/cancel/', {
      method: 'POST',
    });
  });

  it('flightCount calls GET /waitlist/flight/:flightId/', async () => {
    await waitlistAPI.flightCount(12);
    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/waitlist/flight/12/');
  });
});

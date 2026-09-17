import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookingAPI } from '../bookingService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  fetchWithAuth: vi.fn(),
}));

describe('bookingAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create sends POST request with booking payload', async () => {
    const mockBooking = { id: 10, status: 'CONFIRMED' };
    apiClient.fetchWithAuth.mockResolvedValueOnce(mockBooking);

    const passengers = [{ first_name: 'John', last_name: 'Doe' }];
    const result = await bookingAPI.create(5, passengers, 'BUSINESS');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/', {
      method: 'POST',
      body: JSON.stringify({
        flight: 5,
        cabin_class: 'BUSINESS',
        passengers,
      }),
    });
    expect(result).toEqual(mockBooking);
  });

  it('list builds query parameters for pnr and status', async () => {
    await bookingAPI.list({ pnr: 'PNR123', status: 'CONFIRMED' });

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/bookings/?pnr=PNR123&status=CONFIRMED'
    );
  });

  it('list calls endpoint without query string when params are empty', async () => {
    await bookingAPI.list();

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/');
  });

  it('retrieve calls GET /bookings/:id/', async () => {
    await bookingAPI.retrieve(42);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/42/');
  });

  it('cancel calls POST /bookings/:id/cancel/', async () => {
    await bookingAPI.cancel(42);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/42/cancel/', {
      method: 'POST',
    });
  });

  it('getPassengers formats search query string correctly', async () => {
    await bookingAPI.getPassengers('John Doe');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/bookings/passengers/?search=John%20Doe'
    );
  });

  it('getPassengers calls endpoint without search query string when search is empty', async () => {
    await bookingAPI.getPassengers();

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/passengers/');
  });

  it('holdSeat handles new hold and seat swap (old_seat_number)', async () => {
    await bookingAPI.holdSeat(12, '12A');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/holds/', {
      method: 'POST',
      body: JSON.stringify({
        flight_instance: 12,
        seat_number: '12A',
      }),
    });

    await bookingAPI.holdSeat(12, '14C', '12A');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/holds/', {
      method: 'POST',
      body: JSON.stringify({
        flight_instance: 12,
        seat_number: '14C',
        old_seat_number: '12A',
      }),
    });
  });

  it('releaseHold calls DELETE /bookings/holds/:id/', async () => {
    await bookingAPI.releaseHold(99);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/holds/99/', {
      method: 'DELETE',
    });
  });

  it('downloadPdf fetches blob and triggers file download', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    apiClient.fetchWithAuth.mockResolvedValueOnce(mockBlob);

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});

    await bookingAPI.downloadPdf(15, 'REF123');

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/bookings/15/download-pdf/');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAnchor.download).toBe('Passenger-Ticket-REF123.pdf');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.remove).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-url');

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  it('sendTicketEmail calls POST /bookings/:id/send-ticket-email/', async () => {
    await bookingAPI.sendTicketEmail(15);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith(
      '/bookings/15/send-ticket-email/',
      { method: 'POST' }
    );
  });
});

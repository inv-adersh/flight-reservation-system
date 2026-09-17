import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithAuth, getResponseData, API_BASE_URL } from '@/services/apiClient';

describe('apiClient — getResponseData', () => {
  it('returns null for status 204 No Content', async () => {
    const res = { status: 204, headers: new Headers() };
    const data = await getResponseData(res);
    expect(data).toBeNull();
  });

  it('returns blob when Content-Type is application/pdf', async () => {
    const blob = new Blob(['pdf bytes'], { type: 'application/pdf' });
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/pdf' }),
      blob: vi.fn().mockResolvedValue(blob),
    };
    const data = await getResponseData(res);
    expect(data).toBe(blob);
  });

  it('returns null when response text is empty', async () => {
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(''),
    };
    const data = await getResponseData(res);
    expect(data).toBeNull();
  });

  it('unwraps global API envelope with status success and data object', async () => {
    const payload = { status: 'success', data: { id: 1, name: 'Test' } };
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    };
    const data = await getResponseData(res);
    expect(data).toEqual({ id: 1, name: 'Test' });
  });

  it('attaches json.message if json.data is an object without message', async () => {
    const payload = { status: 'success', data: { id: 1 }, message: 'Created successfully' };
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    };
    const data = await getResponseData(res);
    expect(data).toEqual({ id: 1, message: 'Created successfully' });
  });

  it('returns message object if json.data is undefined but message exists', async () => {
    const payload = { status: 'success', message: 'Action completed' };
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    };
    const data = await getResponseData(res);
    expect(data).toEqual({ message: 'Action completed' });
  });

  it('returns raw text when JSON parsing fails', async () => {
    const res = {
      status: 200,
      headers: new Headers({ 'Content-Type': 'text/plain' }),
      text: vi.fn().mockResolvedValue('Plain string output'),
    };
    const data = await getResponseData(res);
    expect(data).toBe('Plain string output');
  });
});

describe('apiClient — fetchWithAuth', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches successfully with JSON content-type by default', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify({ id: 10, title: 'Flight A' })),
    };
    globalThis.fetch.mockResolvedValue(mockResponse);

    const data = await fetchWithAuth('/flights/10/');
    expect(data).toEqual({ id: 10, title: 'Flight A' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/flights/10/`,
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('omits Content-Type header when body is FormData', async () => {
    const formData = new FormData();
    formData.append('file', 'data');

    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify({ success: true })),
    };
    globalThis.fetch.mockResolvedValue(mockResponse);

    await fetchWithAuth('/upload/', { method: 'POST', body: formData });

    const callArgs = globalThis.fetch.mock.calls[0][1];
    expect(callArgs.headers['Content-Type']).toBeUndefined();
  });

  it('throws connection error when network fails', async () => {
    globalThis.fetch.mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchWithAuth('/test/')).rejects.toThrow(
      'Unable to connect to server. Please check backend connection.'
    );
  });

  it('re-throws AbortError if request was intentionally aborted', async () => {
    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    globalThis.fetch.mockRejectedValue(abortErr);

    await expect(fetchWithAuth('/test/')).rejects.toThrow('Aborted');
  });

  it('throws server error on 502, 503, or 504 responses', async () => {
    globalThis.fetch.mockResolvedValue({
      status: 503,
      ok: false,
      headers: new Headers(),
    });

    await expect(fetchWithAuth('/maintenance/')).rejects.toThrow(
      'Server is currently experiencing issues. Please try again shortly.'
    );
  });

  it('handles 401 unauthorized with successful silent cookie refresh and request retry', async () => {
    const initial401Response = {
      ok: false,
      status: 401,
      headers: new Headers(),
    };
    const refreshSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };
    const retriedSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify({ secret: 'data' })),
    };

    globalThis.fetch
      .mockResolvedValueOnce(initial401Response) // First call -> 401
      .mockResolvedValueOnce(refreshSuccessResponse) // Refresh call -> 200
      .mockResolvedValueOnce(retriedSuccessResponse); // Retry call -> 200

    const result = await fetchWithAuth('/protected/');
    expect(result).toEqual({ secret: 'data' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws session expired error when refresh token call fails on 401', async () => {
    const initial401Response = {
      ok: false,
      status: 401,
      headers: new Headers(),
    };
    const refreshFailedResponse = {
      ok: false,
      status: 401,
      headers: new Headers(),
    };

    globalThis.fetch
      .mockResolvedValueOnce(initial401Response)
      .mockResolvedValueOnce(refreshFailedResponse);

    await expect(fetchWithAuth('/protected/')).rejects.toThrow(
      'Session expired. Please log in again.'
    );
  });

  it('throws formatted error object when non-401 request is not ok', async () => {
    const errorResponse = {
      ok: false,
      status: 400,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: vi.fn().mockResolvedValue(JSON.stringify({ detail: 'Invalid request data' })),
    };
    globalThis.fetch.mockResolvedValue(errorResponse);

    await expect(fetchWithAuth('/bad-request/')).rejects.toThrow('Invalid request data');
  });
});

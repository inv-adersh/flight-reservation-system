import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsAPI } from '../notificationsService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  fetchWithAuth: vi.fn(),
}));

describe('notificationsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list calls GET /notifications/', async () => {
    const mockNotifications = [{ id: 1, title: 'Flight Update', is_read: false }];
    apiClient.fetchWithAuth.mockResolvedValueOnce(mockNotifications);

    const result = await notificationsAPI.list();

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/notifications/');
    expect(result).toEqual(mockNotifications);
  });

  it('read calls PATCH /notifications/:id/read/', async () => {
    apiClient.fetchWithAuth.mockResolvedValueOnce({ id: 5, is_read: true });

    const result = await notificationsAPI.read(5);

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/notifications/5/read/', {
      method: 'PATCH',
    });
    expect(result).toEqual({ id: 5, is_read: true });
  });

  it('markAllRead calls POST /notifications/mark-all-read/', async () => {
    apiClient.fetchWithAuth.mockResolvedValueOnce({ message: 'All marked as read' });

    const result = await notificationsAPI.markAllRead();

    expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/notifications/mark-all-read/', {
      method: 'POST',
    });
    expect(result).toEqual({ message: 'All marked as read' });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authAPI } from '../authService';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  API_BASE_URL: '/api',
  fetchWithAuth: vi.fn(),
  getResponseData: vi.fn(),
}));

describe('authAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('register', () => {
    it('sends POST request to /auth/register/ and returns response data', async () => {
      const mockData = { message: 'User registered successfully' };
      global.fetch.mockResolvedValueOnce({ ok: true });
      apiClient.getResponseData.mockResolvedValueOnce(mockData);

      const userData = { username: 'testuser', email: 'test@example.com', password: 'Password123!' };
      const result = await authAPI.register(userData);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      expect(result).toEqual(mockData);
    });

    it('throws error when response is not ok (string error)', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      apiClient.getResponseData.mockResolvedValueOnce('Username already taken');

      await expect(authAPI.register({})).rejects.toThrow('Username already taken');
    });

    it('throws stringified error object when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      const errObj = { email: ['Invalid email format'] };
      apiClient.getResponseData.mockResolvedValueOnce(errObj);

      await expect(authAPI.register({})).rejects.toThrow(JSON.stringify(errObj));
    });
  });

  describe('login', () => {
    it('sends POST request with credentials to /auth/login/', async () => {
      const mockResponse = { data: { id: 1, username: 'testuser', role: 'CUSTOMER' } };
      global.fetch.mockResolvedValueOnce({ ok: true });
      apiClient.getResponseData.mockResolvedValueOnce(mockResponse);

      const credentials = { username: 'testuser', password: 'password' };
      const result = await authAPI.login(credentials);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('calls fetchWithAuth for /auth/logout/', async () => {
      apiClient.fetchWithAuth.mockResolvedValueOnce({ message: 'Logged out' });

      const result = await authAPI.logout();

      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/auth/logout/', {
        method: 'POST',
      });
      expect(result).toEqual({ message: 'Logged out' });
    });

    it('returns null if fetchWithAuth fails during logout', async () => {
      const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      apiClient.fetchWithAuth.mockRejectedValueOnce(new Error('Network error'));

      const result = await authAPI.logout();

      expect(result).toBeNull();
      expect(spyWarn).toHaveBeenCalled();
      spyWarn.mockRestore();
    });
  });

  describe('googleLogin', () => {
    it('sends google token to /auth/google-login/', async () => {
      const mockResponse = { data: { id: 2, username: 'googleuser', role: 'CUSTOMER' } };
      global.fetch.mockResolvedValueOnce({ ok: true });
      apiClient.getResponseData.mockResolvedValueOnce(mockResponse);

      const result = await authAPI.googleLogin('google-id-token');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/google-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'google-id-token' }),
        credentials: 'include',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('calls fetchWithAuth for /auth/profile/', async () => {
      const mockProfile = { id: 1, username: 'testuser', email: 'test@example.com' };
      apiClient.fetchWithAuth.mockResolvedValueOnce(mockProfile);

      const result = await authAPI.getProfile();

      expect(apiClient.fetchWithAuth).toHaveBeenCalledWith('/auth/profile/');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('forgotPassword & resetPassword', () => {
    it('forgotPassword sends email to /auth/password/forgot/', async () => {
      const mockResp = { message: 'OTP sent' };
      global.fetch.mockResolvedValueOnce({ ok: true });
      apiClient.getResponseData.mockResolvedValueOnce(mockResp);

      const result = await authAPI.forgotPassword('test@example.com');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/password/forgot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(result).toEqual(mockResp);
    });

    it('resetPassword sends email, otp, and new_password to /auth/password/reset/', async () => {
      const mockResp = { message: 'Password reset successfully' };
      global.fetch.mockResolvedValueOnce({ ok: true });
      apiClient.getResponseData.mockResolvedValueOnce(mockResp);

      const result = await authAPI.resetPassword('test@example.com', '123456', 'newpass123');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/password/reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', otp: '123456', new_password: 'newpass123' }),
      });
      expect(result).toEqual(mockResp);
    });
  });
});

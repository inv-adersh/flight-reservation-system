import { describe, it, expect, vi, beforeEach } from 'vitest';
import authReducer, {
  logout,
  clearAuthError,
  updateProfileSuccess,
  loginUser,
  googleLoginUser,
  registerUser,
  fetchProfile,
  logoutUser,
} from '../authSlice';
import { authAPI } from '@/services/auth-service/authService';

vi.mock('@/services/auth-service/authService', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    googleLogin: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
  },
}));

describe('authSlice', () => {
  const initialState = {
    token: null,
    decodedToken: null,
    profile: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: false,
    isInitializing: true,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('synchronous reducers', () => {
    it('returns the initial state by default', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('handles logout action correctly', () => {
      const state = {
        ...initialState,
        profile: { username: 'john' },
        isAuthenticated: true,
        isAdmin: true,
        error: 'Some error',
      };
      const newState = authReducer(state, logout());
      expect(newState.profile).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isAdmin).toBe(false);
      expect(newState.isInitializing).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('handles clearAuthError action', () => {
      const state = { ...initialState, error: 'Login failed' };
      const newState = authReducer(state, clearAuthError());
      expect(newState.error).toBeNull();
    });

    it('handles updateProfileSuccess action and computes isAdmin flag', () => {
      const state = { ...initialState, profile: null, isAdmin: false };

      const userProfile = { id: 1, role: 'CUSTOMER', is_superuser: false, is_staff: false };
      const state1 = authReducer(state, updateProfileSuccess(userProfile));
      expect(state1.profile).toEqual(userProfile);
      expect(state1.isAdmin).toBe(false);

      const adminProfile = { id: 2, role: 'ADMIN', is_superuser: false, is_staff: false };
      const state2 = authReducer(state, updateProfileSuccess(adminProfile));
      expect(state2.isAdmin).toBe(true);

      const staffProfile = { id: 3, role: 'CUSTOMER', is_superuser: false, is_staff: true };
      const state3 = authReducer(state, updateProfileSuccess(staffProfile));
      expect(state3.isAdmin).toBe(true);
    });
  });

  describe('loginUser thunk & reducers', () => {
    it('dispatches loginUser.fulfilled and sets auth state for valid credentials', async () => {
      const mockUserData = { id: 10, username: 'testuser', email: 'test@example.com', role: 'CUSTOMER' };
      authAPI.login.mockResolvedValueOnce({ data: mockUserData });

      const dispatch = vi.fn();
      const thunk = loginUser({ credentials: { username: 'testuser', password: 'pass' } });
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/loginUser/fulfilled');
      expect(result.payload.profile).toEqual({
        id: 10,
        username: 'testuser',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });
      expect(result.payload.isAdmin).toBe(false);

      const newState = authReducer(initialState, result);
      expect(newState.loading).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isInitializing).toBe(false);
    });

    it('rejects login when requireAdmin is set but user is not admin', async () => {
      const mockUserData = { id: 10, username: 'customer', role: 'CUSTOMER' };
      authAPI.login.mockResolvedValueOnce({ data: mockUserData });

      const dispatch = vi.fn();
      const thunk = loginUser({ credentials: { username: 'customer' }, requireAdmin: true });
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/loginUser/rejected');
      expect(result.payload).toBe('Access Denied: Administrator privileges required.');
    });

    it('rejects login when requireCustomer is set but user is admin', async () => {
      const mockUserData = { id: 1, username: 'admin', role: 'ADMIN' };
      authAPI.login.mockResolvedValueOnce({ data: mockUserData });

      const dispatch = vi.fn();
      const thunk = loginUser({ credentials: { username: 'admin' }, requireCustomer: true });
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/loginUser/rejected');
      expect(result.payload).toBe('Invalid username or password');
    });

    it('handles loginUser.pending and loginUser.rejected extraReducers', () => {
      const pendingState = authReducer(initialState, { type: loginUser.pending.type });
      expect(pendingState.loading).toBe(true);
      expect(pendingState.error).toBeNull();

      const rejectedState = authReducer(initialState, {
        type: loginUser.rejected.type,
        payload: 'Invalid credentials',
      });
      expect(rejectedState.loading).toBe(false);
      expect(rejectedState.error).toBe('Invalid credentials');
    });
  });

  describe('googleLoginUser thunk', () => {
    it('dispatches googleLoginUser.fulfilled for valid Google token', async () => {
      const mockData = { id: 15, username: 'guser', email: 'guser@gmail.com', role: 'CUSTOMER' };
      authAPI.googleLogin.mockResolvedValueOnce({ data: mockData });

      const dispatch = vi.fn();
      const thunk = googleLoginUser({ token: 'google-token' });
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/googleLoginUser/fulfilled');
      const newState = authReducer(initialState, result);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.profile.email).toBe('guser@gmail.com');
    });
  });

  describe('registerUser thunk', () => {
    it('dispatches registerUser.fulfilled on successful registration', async () => {
      authAPI.register.mockResolvedValueOnce({ message: 'Success' });

      const dispatch = vi.fn();
      const thunk = registerUser({ username: 'newuser' });
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/registerUser/fulfilled');
      const newState = authReducer(initialState, result);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBeNull();
    });
  });

  describe('fetchProfile thunk & reducers', () => {
    it('populates profile and marks user as authenticated on fetchProfile.fulfilled', async () => {
      const profile = { id: 1, username: 'loggeduser', role: 'ADMIN' };
      authAPI.getProfile.mockResolvedValueOnce(profile);

      const dispatch = vi.fn();
      const thunk = fetchProfile();
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/fetchProfile/fulfilled');

      const newState = authReducer(initialState, result);
      expect(newState.isInitializing).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.profile).toEqual(profile);
      expect(newState.isAdmin).toBe(true);
    });

    it('resets auth state on fetchProfile.rejected (e.g., 401 unauthenticated)', async () => {
      authAPI.getProfile.mockRejectedValueOnce(new Error('Unauthorized'));

      const dispatch = vi.fn();
      const thunk = fetchProfile();
      const result = await thunk(dispatch, () => ({}), undefined);

      expect(result.type).toBe('auth/fetchProfile/rejected');

      const activeState = { ...initialState, isAuthenticated: true, profile: { id: 1 } };
      const newState = authReducer(activeState, result);

      expect(newState.isInitializing).toBe(false);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.profile).toBeNull();
      expect(newState.isAdmin).toBe(false);
    });
  });

  describe('logoutUser thunk', () => {
    it('calls authAPI.logout and dispatches logout reducer', async () => {
      authAPI.logout.mockResolvedValueOnce(null);

      const dispatch = vi.fn();
      const thunk = logoutUser();
      await thunk(dispatch, () => ({}), undefined);

      expect(authAPI.logout).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(logout());
    });

    it('still dispatches logout reducer even if authAPI.logout throws an error', async () => {
      authAPI.logout.mockRejectedValueOnce(new Error('Network error'));

      const dispatch = vi.fn();
      const thunk = logoutUser();
      await thunk(dispatch, () => ({}), undefined);

      expect(dispatch).toHaveBeenCalledWith(logout());
    });
  });
});

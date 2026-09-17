import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { parseApiError, handleApiError, logError } from '../errorUtils';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('errorUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseApiError', () => {
    it('returns fallback if err is falsy', () => {
      expect(parseApiError(null)).toBe('An unexpected error occurred.');
      expect(parseApiError(undefined, 'Custom fallback')).toBe('Custom fallback');
    });

    it('returns plain string error', () => {
      expect(parseApiError('Invalid credentials')).toBe('Invalid credentials');
      expect(parseApiError('', 'Fallback')).toBe('Fallback');
    });

    it('handles Error instance with err.data', () => {
      const err = new Error('Wrapper error');
      err.data = { detail: 'Data level error' };
      expect(parseApiError(err)).toBe('Data level error');
    });

    it('handles Error instance with "null" message', () => {
      const err = new Error('null');
      expect(parseApiError(err)).toBe('An unexpected error occurred. Please check backend connection.');
    });

    it('unwraps JSON-serialized message from Error instance', () => {
      const err = new Error(JSON.stringify({ detail: 'Unwrapped DRF detail' }));
      expect(parseApiError(err)).toBe('Unwrapped DRF detail');
    });

    it('handles JSON parse failure gracefully in Error instance message', () => {
      const err = new Error('{ invalid json string');
      expect(parseApiError(err)).toBe('{ invalid json string');
    });

    it('returns plain message from Error instance', () => {
      const err = new Error('Network failure');
      expect(parseApiError(err)).toBe('Network failure');
    });

    it('parses custom envelope { message, errors } shape', () => {
      const err1 = {
        message: 'An error occurred.',
        errors: { email: ['Email already exists'], username: 'Username taken' },
      };
      expect(parseApiError(err1)).toBe('Email: Email already exists · Username: Username taken');

      const err2 = {
        message: 'Validation Failed',
        errors: { age: ['Must be at least 18'] },
      };
      expect(parseApiError(err2)).toBe('Validation Failed — Age: Must be at least 18');
    });

    it('parses object with err.message string', () => {
      expect(parseApiError({ message: 'Custom message' })).toBe('Custom message');
    });

    it('parses DRF detail field (string and array)', () => {
      expect(parseApiError({ detail: 'Token expired' })).toBe('Token expired');
      expect(parseApiError({ detail: ['Permission denied', 'Extra'] })).toBe('Permission denied');
    });

    it('parses DRF non_field_errors array', () => {
      expect(parseApiError({ non_field_errors: ['Invalid username or password'] })).toBe('Invalid username or password');
    });

    it('parses DRF field-level errors', () => {
      expect(parseApiError({ flight_number: ['This field is required'] })).toBe('This field is required');
      expect(parseApiError({ passport: 'Invalid format' })).toBe('Invalid format');
    });

    it('returns fallback for empty object or unrecognized structure', () => {
      expect(parseApiError({})).toBe('An unexpected error occurred.');
      expect(parseApiError({ status: 'error', errors: {} }, 'Default')).toBe('Default');
    });
  });

  describe('handleApiError', () => {
    it('triggers toast.error and returns parsed message by default', () => {
      const result = handleApiError('Test error message');
      expect(result).toBe('Test error message');
      expect(toast.error).toHaveBeenCalledWith('Test error message');
    });

    it('suppresses toast when silent is true', () => {
      const result = handleApiError('Background error', { silent: true });
      expect(result).toBe('Background error');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('uses custom fallback message', () => {
      const result = handleApiError(null, { fallback: 'Custom fallback error' });
      expect(result).toBe('Custom fallback error');
      expect(toast.error).toHaveBeenCalledWith('Custom fallback error');
    });

    it('populates field-level errors when setErrors setter is provided', () => {
      const setErrors = vi.fn();
      const err = {
        email: ['Email is invalid'],
        password: 'Password too short',
        errors: { phone: ['Phone is required'] },
      };

      handleApiError(err, { setErrors });

      expect(setErrors).toHaveBeenCalledTimes(1);
      const updateFn = setErrors.mock.calls[0][0];
      const prev = { existingField: 'existing' };
      const updated = updateFn(prev);

      expect(updated).toEqual({
        existingField: 'existing',
        email: 'Email is invalid',
        password: 'Password too short',
        phone: 'Phone is required',
      });
    });

    it('populates field-level errors from JSON-serialized Error instance when setErrors is provided', () => {
      const setErrors = vi.fn();
      const err = new Error(JSON.stringify({ code: ['Code invalid'] }));

      handleApiError(err, { setErrors });

      expect(setErrors).toHaveBeenCalled();
      const updateFn = setErrors.mock.calls[0][0];
      const updated = updateFn({});
      expect(updated).toEqual({ code: 'Code invalid' });
    });
  });

  describe('logError', () => {
    it('logs formatted error to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError('AuthModule', new Error('Something went wrong'));

      expect(spy).toHaveBeenCalledWith('[AuthModule]', expect.any(Error));
      spy.mockRestore();
    });
  });
});

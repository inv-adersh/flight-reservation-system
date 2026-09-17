import { describe, it, expect, vi, beforeEach } from 'vitest';
import systemReducer, { setServerDown, checkServerHealth } from '../systemSlice';
import airportsReducer, { setAirports, clearAirports, fetchAirports } from '../airportsSlice';
import comparisonReducer, { addToComparison, removeFromComparison, clearComparison, fetchComparison } from '../comparisonSlice';
import { createCrudSlice } from '@/admin/_core/store/crudSliceFactory';

// ── Mock services ─────────────────────────────────────────────────────────────
vi.mock('@/services/flight-service/flightService', () => ({
  flightsAPI: {
    getAirports: vi.fn(),
    compareFlights: vi.fn(),
  },
}));

import { flightsAPI } from '@/services/flight-service/flightService';

describe('systemSlice', () => {
  const initialState = {
    isServerDown: false,
    isCheckingHealth: false,
    lastCheckedAt: null,
  };

  it('handles initial state and setServerDown reducer', () => {
    expect(systemReducer(undefined, { type: 'unknown' })).toEqual(initialState);

    const nextState = systemReducer(initialState, setServerDown(true));
    expect(nextState.isServerDown).toBe(true);

    const resetState = systemReducer(nextState, setServerDown(false));
    expect(resetState.isServerDown).toBe(false);
  });

  it('handles checkServerHealth lifecycle actions', () => {
    let state = systemReducer(initialState, checkServerHealth.pending());
    expect(state.isCheckingHealth).toBe(true);

    state = systemReducer(state, checkServerHealth.fulfilled(true));
    expect(state.isCheckingHealth).toBe(false);
    expect(state.isServerDown).toBe(false);
    expect(state.lastCheckedAt).not.toBeNull();

    state = systemReducer(state, checkServerHealth.rejected(null, '', null, 'Server connection failed'));
    expect(state.isCheckingHealth).toBe(false);
    expect(state.isServerDown).toBe(true);
  });
});

describe('airportsSlice', () => {
  const initialState = {
    items: [],
    loading: false,
    loaded: false,
    error: null,
  };

  it('handles setAirports and clearAirports reducers', () => {
    const list = [{ id: 1, code: 'DEL', city: 'New Delhi' }];
    let state = airportsReducer(initialState, setAirports(list));
    expect(state.items).toEqual(list);
    expect(state.loaded).toBe(true);

    state = airportsReducer(state, clearAirports());
    expect(state.items).toEqual([]);
    expect(state.loaded).toBe(false);
  });

  it('handles fetchAirports async thunk integration', async () => {
    const mockAirports = [{ id: 10, iata_code: 'BOM', city: 'Mumbai', airport_name: 'Chhatrapati Shivaji' }];
    flightsAPI.getAirports.mockResolvedValueOnce({ results: mockAirports });

    const dispatch = vi.fn();
    const thunk = fetchAirports();
    const result = await thunk(dispatch, () => ({}), undefined);

    expect(result.type).toBe('airports/fetchAirports/fulfilled');
    expect(result.payload).toEqual([
      expect.objectContaining({ code: 'BOM', city: 'Mumbai' }),
    ]);
  });
});

describe('comparisonSlice', () => {
  const initialState = {
    selectedIds: [],
    comparisonData: [],
    loading: false,
    error: null,
  };

  it('handles addToComparison up to 4 items and prevents duplicates', () => {
    let state = comparisonReducer(initialState, addToComparison(1));
    state = comparisonReducer(state, addToComparison(2));
    state = comparisonReducer(state, addToComparison(3));
    state = comparisonReducer(state, addToComparison(4));
    expect(state.selectedIds).toEqual([1, 2, 3, 4]);

    // Attempting 5th item or duplicate should be ignored
    state = comparisonReducer(state, addToComparison(5));
    state = comparisonReducer(state, addToComparison(1));
    expect(state.selectedIds).toEqual([1, 2, 3, 4]);
  });

  it('handles removeFromComparison and clearComparison', () => {
    let state = comparisonReducer(
      { ...initialState, selectedIds: [1, 2, 3], comparisonData: [{ id: 1 }] },
      removeFromComparison(2)
    );
    expect(state.selectedIds).toEqual([1, 3]);

    state = comparisonReducer(state, clearComparison());
    expect(state.selectedIds).toEqual([]);
    expect(state.comparisonData).toEqual([]);
  });

  it('handles fetchComparison async thunk success and rejection', async () => {
    flightsAPI.compareFlights.mockResolvedValueOnce({ data: [{ flight_id: 100 }] });

    const dispatch = vi.fn();
    const thunk = fetchComparison([100]);
    const result = await thunk(dispatch, () => ({}), undefined);

    expect(result.type).toBe('comparison/fetchComparison/fulfilled');

    let state = comparisonReducer(initialState, result);
    expect(state.comparisonData).toEqual([{ flight_id: 100 }]);

    // Rejection state
    state = comparisonReducer(state, fetchComparison.rejected(null, '', [100], 'Server error'));
    expect(state.error).toBe('Server error');
  });
});

describe('crudSliceFactory', () => {
  it('creates a customized Redux CRUD slice with generated thunks and reducers', () => {
    const { slice, actions, thunks } = createCrudSlice('testEntity', '/api/test');

    expect(slice.name).toBe('testEntity');
    expect(typeof slice.reducer).toBe('function');
    expect(typeof thunks.fetchList).toBe('function');
    expect(typeof thunks.add).toBe('function');
    expect(typeof thunks.update).toBe('function');
    expect(typeof thunks.remove).toBe('function');

    // Test reducer action clearErrors
    const initialCrudState = { items: [], loading: false, validationErrors: { name: 'error' } };
    const nextState = slice.reducer(initialCrudState, actions.clearErrors());
    expect(nextState.validationErrors).toBeNull();
  });
});

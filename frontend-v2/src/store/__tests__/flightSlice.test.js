import { describe, it, expect, vi, beforeEach } from 'vitest';
import flightReducer, {
  setCurrentPage,
  setFilters,
  clearFilters,
  clearFlightErrors,
  clearFlightDetail,
  clearFlightsList,
  fetchFlights,
  fetchFlightDetail,
  deleteFlight,
} from '../flightSlice';

vi.mock('@/services/flight-service/flightService', () => ({
  flightsAPI: {
    list: vi.fn(),
    retrieve: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    stats: vi.fn(),
    getCalendar: vi.fn(),
  },
}));

import { flightsAPI } from '@/services/flight-service/flightService';

describe('flightSlice reducers & thunks', () => {
  let initialState;

  beforeEach(() => {
    vi.clearAllMocks();
    initialState = flightReducer(undefined, { type: 'unknown' });
  });

  it('updates page and filters reducers', () => {
    let state = flightReducer(initialState, setCurrentPage(3));
    expect(state.currentPage).toBe(3);

    state = flightReducer(state, setFilters({ search: 'Air India', cabin_class: 'BUSINESS' }));
    expect(state.filters.search).toBe('Air India');
    expect(state.filters.cabin_class).toBe('BUSINESS');

    state = flightReducer(state, clearFilters());
    expect(state.filters).toEqual({});
  });

  it('handles clearing state reducers', () => {
    let state = {
      ...initialState,
      error: 'Some Error',
      detail: { id: 1 },
      list: [{ id: 1 }],
    };

    state = flightReducer(state, clearFlightErrors());
    expect(state.error).toBeNull();

    state = flightReducer(state, clearFlightDetail());
    expect(state.detail).toBeNull();

    state = flightReducer(state, clearFlightsList());
    expect(state.list).toEqual([]);
  });

  it('handles fetchFlights thunk pending, fulfilled, rejected', async () => {
    const responseData = {
      count: 1,
      results: [{ id: 1, flight_number: 'AI101' }],
    };
    flightsAPI.list.mockResolvedValueOnce(responseData);

    let state = flightReducer(initialState, fetchFlights.pending());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    state = flightReducer(state, fetchFlights.fulfilled(responseData));
    expect(state.loading).toBe(false);
    expect(state.list).toEqual(responseData.results);
    expect(state.count).toBe(1);

    state = flightReducer(state, fetchFlights.rejected(null, '', null, 'Server Error'));
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Server Error');
  });

  it('handles fetchFlightDetail thunk', async () => {
    const flight = { id: 5, flight_number: 'LH400' };
    flightsAPI.retrieve.mockResolvedValueOnce(flight);

    let state = flightReducer(initialState, fetchFlightDetail.pending());
    expect(state.detailLoading).toBe(true);

    state = flightReducer(state, fetchFlightDetail.fulfilled(flight));
    expect(state.detailLoading).toBe(false);
    expect(state.detail).toEqual(flight);

    state = flightReducer(state, fetchFlightDetail.rejected(null, '', null, 'Not found'));
    expect(state.detailLoading).toBe(false);
    expect(state.error).toBe('Not found');
  });

  it('handles deleteFlight thunk fulfilled', () => {
    const startState = {
      ...initialState,
      list: [{ id: 1 }, { id: 2 }],
      count: 2,
    };

    const state = flightReducer(startState, deleteFlight.fulfilled(1));
    expect(state.list.length).toBe(1);
    expect(state.list[0].id).toBe(2);
    expect(state.count).toBe(1);
  });
});

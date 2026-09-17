import { describe, it, expect, vi } from 'vitest';
import flightReducer, {
  clearFlightErrors,
  clearFlightDetail,
  setCurrentPage,
  setFilters,
  clearFilters,
  clearFlightsList,
  fetchFlights,
  fetchFlightBounds,
  fetchFlightCalendar,
  fetchFlightStats,
  fetchFlightDetail,
  addFlight,
  updateFlight,
  deleteFlight,
} from '../flightSlice';

vi.mock('@/services/flight-service/flightService', () => ({
  flightsAPI: {
    list: vi.fn(),
    getBounds: vi.fn(),
    getCalendar: vi.fn(),
    stats: vi.fn(),
    retrieve: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { flightsAPI } from '@/services/flight-service/flightService';

describe('flightSlice — reducers', () => {
  const initialState = {
    list: [],
    detail: null,
    loading: false,
    error: null,
    validationErrors: null,
    filters: {},
    currentPage: 1,
    totalPages: 1,
    count: 0,
    bounds: null,
    boundsLoading: false,
    calendar: [],
    calendarLoading: false,
    stats: null,
    statsLoading: false,
  };

  it('handles setCurrentPage, setFilters, clearFilters, clearFlightDetail, clearFlightErrors, and clearFlightsList', () => {
    let state = flightReducer(undefined, { type: 'unknown' });

    state = flightReducer(state, setCurrentPage(3));
    expect(state.currentPage).toBe(3);

    state = flightReducer(state, setFilters({ origin: 'DEL' }));
    expect(state.filters).toEqual({ origin: 'DEL' });

    state = flightReducer(state, clearFilters());
    expect(state.filters).toEqual({});

    state = flightReducer({ ...state, detail: { id: 1 }, error: 'Err', validationErrors: {} }, clearFlightErrors());
    expect(state.error).toBeNull();
    expect(state.validationErrors).toBeNull();

    state = flightReducer({ ...state, detail: { id: 1 } }, clearFlightDetail());
    expect(state.detail).toBeNull();

    state = flightReducer({ ...state, list: [{ id: 1 }], count: 1 }, clearFlightsList());
    expect(state.list).toEqual([]);
    expect(state.count).toBe(0);
  });
});

describe('flightSlice — async thunks', () => {
  const initialState = {
    list: [],
    detail: null,
    loading: false,
    actionLoading: false,
    error: null,
    validationErrors: null,
    bounds: null,
    boundsLoading: false,
    calendar: [],
    calendarLoading: false,
    stats: null,
    statsLoading: false,
    count: 0,
    totalPages: 1,
  };

  it('handles fetchFlights pending, fulfilled, and rejected cases', async () => {
    const flightsList = [{ id: 1, flight_number: 'EK202' }];
    flightsAPI.list.mockResolvedValueOnce({ results: flightsList, count: 1 });

    const dispatch = vi.fn();
    const thunk = fetchFlights({ page: 1, params: { origin: 'DXB' } });
    const result = await thunk(dispatch, () => ({}), undefined);

    expect(result.type).toBe('flights/fetchFlights/fulfilled');

    let state = flightReducer(initialState, result);
    expect(state.list).toEqual(flightsList);
    expect(state.count).toBe(1);

    // Rejected case
    state = flightReducer(state, fetchFlights.rejected(null, '', 1, 'Failed to fetch flights'));
    expect(state.error).toBe('Failed to fetch flights');
  });

  it('handles fetchFlightBounds and fetchFlightCalendar thunks', async () => {
    const boundsData = { min_price: 100, max_price: 500 };
    flightsAPI.getBounds.mockResolvedValueOnce(boundsData);

    const dispatch = vi.fn();
    const result = await fetchFlightBounds({ origin: 'DEL' })(dispatch, () => ({ flights: { boundsLoading: false } }), undefined);
    expect(result.type).toBe('flights/fetchFlightBounds/fulfilled');

    let state = flightReducer(initialState, result);
    expect(state.bounds).toEqual(boundsData);

    // Calendar
    flightsAPI.getCalendar.mockResolvedValueOnce([{ date: '2026-10-01', price: 200 }]);
    const calResult = await fetchFlightCalendar({ origin: 'DEL' })(dispatch, () => ({}), undefined);
    state = flightReducer(state, calResult);
    expect(state.calendar).toEqual([{ date: '2026-10-01', price: 200 }]);
  });

  it('handles fetchFlightStats and fetchFlightDetail thunks', async () => {
    const statsData = { total: 50, active: 40 };
    flightsAPI.stats.mockResolvedValueOnce(statsData);

    const dispatch = vi.fn();
    const statsResult = await fetchFlightStats()(dispatch, () => ({}), undefined);
    let state = flightReducer(initialState, statsResult);
    expect(state.stats).toEqual(statsData);

    const flightDetail = { id: 5, flight_number: 'QR808' };
    flightsAPI.retrieve.mockResolvedValueOnce(flightDetail);

    const detailResult = await fetchFlightDetail(5)(dispatch, () => ({}), undefined);
    state = flightReducer(state, detailResult);
    expect(state.detail).toEqual(flightDetail);
  });

  it('handles addFlight, updateFlight, and deleteFlight thunk state transitions', async () => {
    const newFlight = { id: 99, flight_number: 'LH400' };
    flightsAPI.create.mockResolvedValueOnce(newFlight);

    const dispatch = vi.fn();
    const addResult = await addFlight(newFlight)(dispatch, () => ({}), undefined);
    let state = flightReducer(initialState, addResult);
    expect(state.actionLoading).toBe(false);

    // Update
    const updatedFlight = { id: 99, flight_number: 'LH400-Updated' };
    flightsAPI.update.mockResolvedValueOnce(updatedFlight);
    const updateResult = await updateFlight({ id: 99, data: updatedFlight })(dispatch, () => ({}), undefined);
    state = flightReducer(state, updateResult);
    expect(state.actionLoading).toBe(false);

    // Delete
    flightsAPI.delete.mockResolvedValueOnce({});
    const deleteResult = await deleteFlight(99)(dispatch, () => ({}), undefined);
    state = flightReducer(state, deleteResult);
    expect(state.actionLoading).toBe(false);
  });
});

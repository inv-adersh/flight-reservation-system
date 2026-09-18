import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FaresPage from '../FaresPage';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

function makeStore(extraReducers = {}) {
  return configureStore({
    reducer: {
      auth: () => ({ isAuthenticated: true, isAdmin: true }),
      notifications: () => ({ unreadCount: 0 }),
      flightInstance: (state = { items: [{ id: '10', flight_no: 'AI101', date: '2026-10-01' }] }) => state,
      fare: (state = { items: [], count: 0, loading: false, error: null, validationErrors: null }) => state,
      ...extraReducers,
    },
  });
}

describe('FaresPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const renderFaresPage = (store, initialEntries = ['/admin/operations/fares']) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <FaresPage />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders title and date filter bar in normal mode', () => {
    const store = makeStore();
    renderFaresPage(store);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tomorrow' })).toBeInTheDocument();
  });

  it('toggles quick date chips (Today / Tomorrow)', () => {
    const store = makeStore();
    renderFaresPage(store);

    const todayBtn = screen.getByRole('button', { name: 'Today' });
    fireEvent.click(todayBtn); // Activate Today
    expect(todayBtn).toHaveStyle('background: rgb(112, 93, 0)');

    fireEvent.click(todayBtn); // Deactivate Today
  });

  it('renders instance setup flow banner when instance and inFlow params are passed', () => {
    const store = makeStore();
    renderFaresPage(store, ['/admin/operations/fares?instance=10&inFlow=1&fromPage=2']);

    expect(screen.getByText(/instance setup flow • step 2 \(fares\)/i)).toBeInTheDocument();
    expect(screen.getByText(/adding fares for flight instance #10/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip \/ next: seats/i })).toBeInTheDocument();
  });
});

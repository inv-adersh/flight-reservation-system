import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MealsPage from '../MealsPage';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn(), promise: vi.fn() } }));

vi.mock('@/services/apiClient', () => ({
  fetchWithAuth: vi.fn().mockImplementation((url) => {
    if (url.includes('/airlines')) {
      return Promise.resolve({ results: [{ id: 1, airline_name: 'Air India', iata_airline_code: 'AI' }] });
    }
    if (url.includes('/food-items')) {
      return Promise.resolve({ results: [{ id: 10, airline: 1, name: 'Veg Meal Box' }] });
    }
    return Promise.resolve([]);
  }),
}));

function makeStore(extraReducers = {}) {
  return configureStore({
    reducer: {
      auth: () => ({ isAuthenticated: true, isAdmin: true }),
      notifications: () => ({ unreadCount: 0 }),
      flightMeal: (
        state = {
          items: [{ id: 100, name: 'Standard Breakfast', airline: 1, airline_name: 'Air India', airline_code: 'AI', cabin_class: 'ECONOMY', price: 15, items: [{ food_item: 10, food_item_name: 'Veg Meal Box', quantity: 1 }] }],
          count: 1,
          loading: false,
          actionLoading: false,
          error: null,
        }
      ) => state,
      ...extraReducers,
    },
  });
}

describe('MealsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const renderMealsPage = (store, initialEntries = ['/admin/operations/meals']) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <MealsPage />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders page header, filters bar, and meals table with item details', async () => {
    const store = makeStore();
    renderMealsPage(store);

    expect(screen.getByRole('heading', { name: /flight meals/i })).toBeInTheDocument();
    expect(screen.getByText('Standard Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Economy Class')).toBeInTheDocument();
    expect(screen.getByText(/veg meal box ×1/i)).toBeInTheDocument();
  });

  it('opens Add Meal modal and allows filling meal form', async () => {
    const store = makeStore();
    renderMealsPage(store);

    const addBtn = screen.getByRole('button', { name: /add meal/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add Flight Meal' })).toBeInTheDocument();
    expect(screen.getByLabelText(/meal name/i)).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../Navbar';

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/store/notificationsSlice', () => ({
  fetchNotifications: () => ({ type: 'notifications/fetch' }),
}));

vi.mock('@/store/authSlice', () => ({
  logoutUser: vi.fn().mockImplementation(() => () => Promise.resolve()),
}));

function makeStore(authState = {}, notificationState = { unreadCount: 0 }) {
  return configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, isAdmin: false, profile: null, ...authState }) => state,
      notifications: (state = notificationState) => state,
    },
  });
}

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNavbar = (store, initialEntries = ['/']) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <Navbar />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders brand logo, flights link, and login button when user is unauthenticated', () => {
    const store = makeStore({ isAuthenticated: false, isAdmin: false });
    renderNavbar(store);

    expect(screen.getByAltText('Passenger Logo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /flights/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login or register/i })).toBeInTheDocument();
  });

  it('renders user menu, notifications badge, and customer links for authenticated users', () => {
    const store = makeStore(
      {
        isAuthenticated: true,
        isAdmin: false,
        profile: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      },
      { unreadCount: 3 }
    );

    renderNavbar(store);

    expect(screen.getByRole('link', { name: /bookings/i })).toBeInTheDocument();
    expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders admin navigation bars and Passenger Logo for admin users', () => {
    const store = makeStore({
      isAuthenticated: true,
      isAdmin: true,
      profile: { first_name: 'Admin', username: 'admin' },
    });

    renderNavbar(store, ['/admin/overview']);

    expect(screen.getByAltText('Passenger Logo')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Master Data')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('opens profile dropdown and displays user email and logout option', () => {
    const store = makeStore({
      isAuthenticated: true,
      isAdmin: false,
      profile: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
    });

    renderNavbar(store);

    const avatarBtn = screen.getByText('JD');
    fireEvent.click(avatarBtn);

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('opens logout confirmation modal when Sign Out is clicked in profile menu', () => {
    const store = makeStore({
      isAuthenticated: true,
      isAdmin: false,
      profile: { first_name: 'Alex', last_name: 'Morgan', email: 'alex@example.com' },
    });

    renderNavbar(store);

    const avatarBtn = screen.getByText('AM');
    fireEvent.click(avatarBtn);

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutBtn);

    expect(screen.getByRole('heading', { name: 'Sign Out?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes, Sign Out' })).toBeInTheDocument();
  });
});

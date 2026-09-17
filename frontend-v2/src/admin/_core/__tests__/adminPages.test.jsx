/**
 * Admin pages integration tests — AdminCrudPage + adminSlices
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';

// ── Mock react-hot-toast so it doesn't break jsdom ────────────────────────────
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// ── Mock fetchWithAuth so no real network calls are made ──────────────────────
vi.mock('@/services/apiClient', () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({ results: [], count: 0 }),
}));

// ── Minimal store factory ─────────────────────────────────────────────────────
function makeStore(extraReducers = {}) {
  return configureStore({
    reducer: {
      auth: (s = { isAuthenticated: true, isAdmin: true, profile: null }) => s,
      notifications: (s = { unreadCount: 0 }) => s,
      ...extraReducers,
    },
  });
}

// ── adminSlices smoke test ────────────────────────────────────────────────────
describe('adminSlices — exports', () => {
  it('exports all expected thunks without throwing', async () => {
    const mod = await import('@/admin/_core/store/adminSlices');

    // country slice
    expect(typeof mod.fetchCountries).toBe('function');
    expect(typeof mod.addCountry).toBe('function');
    expect(typeof mod.updateCountry).toBe('function');
    expect(typeof mod.removeCountry).toBe('function');

    // airport slice
    expect(typeof mod.fetchAirports).toBe('function');
    expect(typeof mod.addAirport).toBe('function');

    // airline
    expect(typeof mod.fetchAirlines).toBe('function');

    // aircraft model
    expect(typeof mod.fetchAircraftModels).toBe('function');

    // aircraft
    expect(typeof mod.fetchAircraft).toBe('function');

    // food items
    expect(typeof mod.fetchFoodItems).toBe('function');

    // flight routes
    expect(typeof mod.fetchFlightRoutes).toBe('function');

    // instances
    expect(typeof mod.fetchFlightInstances).toBe('function');

    // generate seats
    expect(typeof mod.generateSeats).toBe('function');

    // fares
    expect(typeof mod.fetchFares).toBe('function');

    // meals
    expect(typeof mod.fetchFlightMeals).toBe('function');
  });
});

// ── AdminCrudPage render & interaction tests ──────────────────────────────────
describe('AdminCrudPage', () => {
  let AdminCrudPage;

  const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'iso_code', label: 'ISO Code' },
    { key: 'status', label: 'Status' },
  ];

  const FIELDS = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'iso_code', label: 'ISO Code', type: 'text', required: true, autoUpper: true },
    { name: 'category', label: 'Category', type: 'select', options: [{ value: 'asia', label: 'Asia' }, { value: 'europe', label: 'Europe' }] },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    { name: 'established_at', label: 'Established', type: 'datetime' },
    { name: 'aliases', label: 'Aliases', type: 'string-array' },
    { name: 'flag', label: 'Flag Image', type: 'file' },
  ];

  const EMPTY_FORM = {
    name: '',
    iso_code: '',
    category: '',
    is_active: false,
    notes: '',
    established_at: '',
    aliases: [''],
    flag: null,
  };

  const fetchListMock = vi.fn().mockImplementation(() => () => Promise.resolve());
  const addMock = vi.fn().mockImplementation((data) => () =>
    Object.assign(Promise.resolve(data), { unwrap: () => Promise.resolve(data) })
  );
  const updateMock = vi.fn().mockImplementation(({ id, data }) => () =>
    Object.assign(Promise.resolve({ id, ...data }), { unwrap: () => Promise.resolve({ id, ...data }) })
  );
  const removeMock = vi.fn().mockImplementation((id) => () =>
    Object.assign(Promise.resolve(id), { unwrap: () => Promise.resolve(id) })
  );

  const fakeThunks = {
    fetchList: fetchListMock,
    add: addMock,
    update: updateMock,
    remove: removeMock,
  };

  const validateForm = (form) => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.iso_code) errors.iso_code = 'ISO Code is required';
    return errors;
  };

  const countryReducer = (
    state = { items: [], count: 0, loading: false, error: null, validationErrors: null, actionLoading: false, selected: null },
    action
  ) => {
    if (action.type === '__TEST/SET_ITEMS') return { ...state, items: action.payload, count: action.payload.length, loading: false };
    if (action.type === '__TEST/SET_COUNT') return { ...state, count: action.payload };
    if (action.type === '__TEST/SET_LOADING') return { ...state, loading: action.payload };
    if (action.type === '__TEST/SET_ACTION_LOADING') return { ...state, actionLoading: action.payload };
    if (action.type === '__TEST/SET_VALIDATION_ERRORS') return { ...state, validationErrors: action.payload };
    return state;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    } else {
      vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});
    }
    const mod = await import('@/admin/_core/AdminCrudPage');
    AdminCrudPage = mod.default;
  });

  const Wrapper = ({ store, children }) => (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );

  const renderComponent = (store, extraProps = {}) => {
    return render(
      <Wrapper store={store}>
        <AdminCrudPage
          config={{
            title: 'Countries',
            entityName: 'country',
            columns: COLUMNS,
            fields: FIELDS,
            emptyForm: EMPTY_FORM,
            validateForm: validateForm,
            thunks: fakeThunks,
            getDeleteDetails: (item) => (item ? `Country: ${item.name}` : null),
            ...extraProps,
          }}
          filterBar={<div data-testid="custom-filter-bar">Filter Bar</div>}
          pageActions={<button data-testid="custom-action">Export</button>}
          {...extraProps}
        />
      </Wrapper>
    );
  };

  // 1. Initial Rendering
  it('renders page header, count, filter bar, breadcrumbs and page actions', () => {
    const store = makeStore({ country: countryReducer });
    store.dispatch({ type: '__TEST/SET_COUNT', payload: 42 });

    renderComponent(store, {
      breadcrumb: [{ label: 'Dashboard', href: '/admin' }, { label: 'Countries' }],
    });

    expect(screen.getByRole('heading', { name: 'Countries' })).toBeInTheDocument();
    expect(screen.getByText('42 total records found')).toBeInTheDocument();
    expect(screen.getByTestId('custom-filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new/i })).toBeInTheDocument();
  });

  // 2. Loading State
  it('renders PageLoader when loading is true and items array is empty', () => {
    const store = makeStore({ country: countryReducer });
    store.dispatch({ type: '__TEST/SET_LOADING', payload: true });

    renderComponent(store);
    expect(screen.getByText(/loading countries/i)).toBeInTheDocument();
  });

  // 3. Empty State
  it('shows empty inbox state when no records exist', () => {
    const store = makeStore({ country: countryReducer });
    renderComponent(store);

    expect(screen.getByText('No countries found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new record or adjust your search.')).toBeInTheDocument();
  });

  // 4. Existing Items & Sorting
  it('shows existing items in table and toggles column sorting', () => {
    const store = makeStore({ country: countryReducer });
    const items = [
      { id: 1, name: 'India', iso_code: 'IND', status: 'Active' },
      { id: 2, name: 'Australia', iso_code: 'AUS', status: 'Active' },
    ];
    store.dispatch({ type: '__TEST/SET_ITEMS', payload: items });

    renderComponent(store);

    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Australia')).toBeInTheDocument();

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc
  });

  // 5. Search & Search Suggestions
  it('handles search typing, form submit, suggestions, and clearing search', async () => {
    const store = makeStore({ country: countryReducer });
    const items = [{ id: 1, name: 'India', iso_code: 'IND' }];
    store.dispatch({ type: '__TEST/SET_ITEMS', payload: items });

    renderComponent(store);

    const searchInput = screen.getByPlaceholderText(/search countries/i);

    // Focus & type to trigger search suggestions
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Ind' } });

    // Suggestion dropdown item should render (matching 'India' and category 'Name')
    const suggestions = await waitFor(() => screen.getAllByText('India'));
    expect(suggestions.length).toBeGreaterThan(1); // [0] table cell, [1] suggestion dropdown item

    // Submit search form
    const searchForm = searchInput.closest('form');
    fireEvent.submit(searchForm);
    expect(fakeThunks.fetchList).toHaveBeenCalledWith({ search: 'Ind', page: 1 });

    // Clear search
    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue('');
  });

  // 6. Pagination
  it('renders Pagination and handles page change', () => {
    const store = makeStore({ country: countryReducer });
    const items = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Country ${i + 1}`, iso_code: `C${i + 1}` }));
    store.dispatch({ type: '__TEST/SET_ITEMS', payload: items });
    store.dispatch({ type: '__TEST/SET_COUNT', payload: 50 });

    renderComponent(store);

    const nextBtn = document.getElementById('pagination-next');
    expect(nextBtn).toBeInTheDocument();

    fireEvent.click(nextBtn);
    expect(fakeThunks.fetchList).toHaveBeenCalledWith({ search: '', page: 2 });
  });

  // 7. Add Modal & Various Form Input Changes
  it('opens add modal, handles input fields (text, select, checkbox, textarea, string-array, file), and submits', async () => {
    const store = makeStore({ country: countryReducer });
    renderComponent(store);

    fireEvent.click(screen.getByRole('button', { name: /add new/i }));
    expect(screen.getByRole('heading', { name: 'Add Countries' })).toBeInTheDocument();

    // Text & autoUpper input
    const nameInput = screen.getByLabelText('Name');
    const isoInput = screen.getByLabelText('ISO Code');
    fireEvent.change(nameInput, { target: { value: 'Japan' } });
    fireEvent.change(isoInput, { target: { value: 'jpn' } });
    expect(isoInput).toHaveValue('JPN'); // converted via autoUpper

    // Select input
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'asia' } });

    // Checkbox input
    const activeCheckbox = screen.getByLabelText('Active');
    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).toBeChecked();

    // Textarea input
    const notesInput = document.querySelector('textarea[name="notes"]');
    fireEvent.change(notesInput, { target: { value: 'Island nation in East Asia' } });

    // String array field - click Add then type in second input
    const addAliasBtn = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addAliasBtn);

    // File upload box
    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['dummy content'], 'flag.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fakeThunks.add).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Countries saved successfully!');
    });
  });

  // 8. Required Field Validation (Local)
  it('shows local validation errors when required fields are empty on submit', async () => {
    const store = makeStore({ country: countryReducer });
    renderComponent(store);

    fireEvent.click(screen.getByRole('button', { name: /add new/i }));

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('ISO Code is required')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Please fix the validation errors.');
    expect(fakeThunks.add).not.toHaveBeenCalled();
  });

  // 9. Save & Next Functionality
  it('submits form and navigates to saveAndNextUrl when Save & Next is clicked', async () => {
    const store = makeStore({ country: countryReducer });
    renderComponent(store, { saveAndNextUrl: '/admin/airports' });

    fireEvent.click(screen.getByRole('button', { name: /add new/i }));

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Singapore' } });
    fireEvent.change(screen.getByLabelText('ISO Code'), { target: { value: 'SGP' } });

    const saveAndNextBtn = screen.getByRole('button', { name: /save & next/i });
    fireEvent.click(saveAndNextBtn);

    await waitFor(() => {
      expect(fakeThunks.add).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Singapore', iso_code: 'SGP' })
      );
      expect(toast.success).toHaveBeenCalledWith('Countries saved successfully!');
    });
  });

  // 10. Edit Button & Update Submit
  it('opens edit modal with pre-filled item values and submits updates', async () => {
    const store = makeStore({ country: countryReducer });
    const item = { id: 10, name: 'India', iso_code: 'IND', category: 'asia', is_active: true };
    store.dispatch({ type: '__TEST/SET_ITEMS', payload: [item] });

    renderComponent(store);

    const editBtn = screen.getByTitle('Edit');
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Edit Countries' })).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveValue('India');

    fireEvent.change(nameInput, { target: { value: 'Republic of India' } });

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fakeThunks.update).toHaveBeenCalledWith({
        id: 10,
        data: expect.objectContaining({ name: 'Republic of India', iso_code: 'IND' }),
      });
      expect(toast.success).toHaveBeenCalledWith('Countries saved successfully!');
    });
  });

  // 11. Delete Modal & Delete Confirmation
  it('opens delete modal and handles delete confirmation', async () => {
    const store = makeStore({ country: countryReducer });
    const item = { id: 5, name: 'Germany', iso_code: 'DEU' };
    store.dispatch({ type: '__TEST/SET_ITEMS', payload: [item] });

    renderComponent(store);

    const deleteBtn = screen.getByTitle('Delete');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete Country')).toBeInTheDocument();

    const confirmModalDeleteBtn = document.querySelector('.flex.gap-3.justify-end .btn-danger');
    fireEvent.click(confirmModalDeleteBtn);

    await waitFor(() => {
      expect(fakeThunks.remove).toHaveBeenCalledWith(5);
    });
  });
});

// ── Navbar — admin mode ───────────────────────────────────────────────────
vi.mock('@/store/notificationsSlice', () => ({
  fetchNotifications: () => ({ type: 'fetchNotifications' }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/admin/analytics' }),
  };
});

describe('Navbar — admin mode', () => {
  it('does NOT contain a "Flights (Legacy)" link', async () => {
    const { default: Navbar } = await import('@/components/layout/Navbar');
    const adminStore = configureStore({
      reducer: {
        auth: () => ({ isAuthenticated: true, isAdmin: true, profile: { first_name: 'Admin', username: 'admin' } }),
        notifications: () => ({ unreadCount: 0 }),
      },
    });
    render(
      <Provider store={adminStore}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.queryByText(/flights \(legacy\)/i)).toBeNull();
  });

  it('contains the Analytics link for admins', async () => {
    const { default: Navbar } = await import('@/components/layout/Navbar');
    const adminStore = configureStore({
      reducer: {
        auth: () => ({ isAuthenticated: true, isAdmin: true, profile: { first_name: 'Admin', username: 'admin' } }),
        notifications: () => ({ unreadCount: 0 }),
      },
    });
    render(
      <Provider store={adminStore}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});

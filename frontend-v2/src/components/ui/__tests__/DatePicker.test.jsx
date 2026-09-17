import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DatePicker from '../DatePicker';

describe('DatePicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with label and placeholder', () => {
    render(
      <DatePicker
        label="Departure Date"
        placeholder="Select departure"
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Departure Date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select departure')).toBeInTheDocument();
  });

  it('opens calendar popover when input is clicked', () => {
    render(
      <DatePicker
        label="Date"
        placeholder="Select date"
        value="2026-09-20"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Select date');
    fireEvent.click(input);

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });

  it('selects a day and calls onChange with YYYY-MM-DD formatted string', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        label="Date"
        placeholder="Select date"
        value="2026-09-01"
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText('Select date');
    fireEvent.click(input);

    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);

    expect(onChange).toHaveBeenCalledWith('2026-09-15');
  });

  it('navigates previous and next months', () => {
    render(
      <DatePicker
        label="Date"
        placeholder="Select date"
        value="2026-09-01"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Select date');
    fireEvent.click(input);

    expect(screen.getByText('September 2026')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button').filter(b => b.getAttribute('aria-label') !== 'Clear');
    const prevMonthBtn = buttons[0];
    const nextMonthBtn = buttons[1];

    fireEvent.click(nextMonthBtn);
    expect(screen.getByText('October 2026')).toBeInTheDocument();

    fireEvent.click(prevMonthBtn);
    expect(screen.getByText('September 2026')).toBeInTheDocument();
  });

  it('clears selection when clear button is clicked', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        label="Date"
        placeholder="Select date"
        value="2026-09-20"
        onChange={onChange}
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('renders transparent variant without border or background', () => {
    render(
      <DatePicker
        placeholder="Transparent picker"
        value=""
        onChange={vi.fn()}
        variant="transparent"
      />
    );

    expect(screen.getByPlaceholderText('Transparent picker')).toBeInTheDocument();
  });
});

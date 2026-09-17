import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DateTimePicker from '../DateTimePicker';

describe('DateTimePicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label and placeholder when value is empty', () => {
    render(
      <DateTimePicker
        id="departure_time"
        label="Departure Time"
        placeholder="Select Date & Time"
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Departure Time')).toBeInTheDocument();
    expect(screen.getByText('Select Date & Time')).toBeInTheDocument();
  });

  it('formats and displays value when provided', () => {
    render(
      <DateTimePicker
        id="departure_time"
        label="Departure Time"
        value="2026-09-20T14:30"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('2026-09-20 14:30')).toBeInTheDocument();
  });

  it('opens popover when trigger button is clicked', () => {
    render(
      <DateTimePicker
        id="departure_time"
        label="Departure Time"
        value="2026-09-20T14:30"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('datetime-trigger');
    fireEvent.click(trigger);

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('September 2026')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('calls onChange when a day is selected', () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        id="departure_time"
        name="departure_time"
        label="Departure Time"
        value="2026-09-01T10:00"
        onChange={onChange}
      />
    );

    const trigger = screen.getByTestId('datetime-trigger');
    fireEvent.click(trigger);

    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: 'departure_time',
        name: 'departure_time',
        value: '2026-09-15T10:00',
      },
    });
  });

  it('handles TimeInput keyboard navigation (ArrowUp / ArrowDown for hours and minutes)', () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        id="departure_time"
        name="departure_time"
        value="2026-09-20T10:00"
        onChange={onChange}
      />
    );

    const trigger = screen.getByTestId('datetime-trigger');
    fireEvent.click(trigger);

    const hoursInput = document.getElementById('departure_time-h');
    fireEvent.keyDown(hoursInput, { key: 'ArrowUp' });

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: 'departure_time',
        name: 'departure_time',
        value: '2026-09-20T11:00',
      },
    });
  });

  it('clears selection when clear button is clicked', () => {
    const onChange = vi.fn();
    render(
      <DateTimePicker
        id="departure_time"
        name="departure_time"
        value="2026-09-20T14:30"
        onChange={onChange}
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith({
      target: {
        id: 'departure_time',
        name: 'departure_time',
        value: '',
      },
    });
  });

  it('closes popover when Done button is clicked', () => {
    render(
      <DateTimePicker
        id="departure_time"
        value="2026-09-20T14:30"
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByTestId('datetime-trigger');
    fireEvent.click(trigger);

    const doneBtn = screen.getByText('Done');
    fireEvent.click(doneBtn);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});

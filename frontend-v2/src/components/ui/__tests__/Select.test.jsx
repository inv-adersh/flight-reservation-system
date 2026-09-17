import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Select } from '../Select';

describe('Select Component', () => {
  const options = [
    { value: 'eco', label: 'Economy' },
    { value: 'bus', label: 'Business' },
    { value: 'fst', label: 'First Class' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label and selected option display text', () => {
    render(<Select id="cabin" label="Cabin Class" options={options} value="bus" onChange={vi.fn()} />);

    expect(screen.getByText('Cabin Class')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Business');
  });

  it('accepts simple string array options', () => {
    render(<Select id="city" label="City" options={['Delhi', 'Mumbai']} value="Delhi" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('Delhi');
  });

  it('opens dropdown listbox on focus/click', () => {
    render(<Select id="cabin" label="Cabin Class" options={options} value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Economy')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('filters options when typing in input', () => {
    render(<Select id="cabin" label="Cabin Class" options={options} value="" onChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'First' } });

    expect(screen.getByText('First Class')).toBeInTheDocument();
    expect(screen.queryByText('Economy')).not.toBeInTheDocument();
  });

  it('calls onChange with selected value when option is clicked', () => {
    const onChange = vi.fn();
    render(<Select id="cabin" label="Cabin Class" options={options} value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const option = screen.getByText('Business');
    fireEvent.mouseDown(option);

    expect(onChange).toHaveBeenCalledWith({
      target: { id: 'cabin', name: 'cabin', value: 'bus' },
    });
  });

  it('supports keyboard navigation (ArrowDown, Enter, Escape)', () => {
    const onChange = vi.fn();
    render(<Select id="cabin" label="Cabin Class" options={options} value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    
    // Press ArrowDown to open listbox
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Press ArrowDown again to highlight second option
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalled();

    // Press Escape to close
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('displays error message and handles disabled state', () => {
    const onChange = vi.fn();
    render(
      <Select
        id="cabin"
        label="Cabin Class"
        options={options}
        value=""
        onChange={onChange}
        error="Field required"
        disabled
      />
    );

    expect(screen.getByText('Field required')).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();

    fireEvent.click(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

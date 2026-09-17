import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders input with label and placeholder', () => {
    render(<Input id="username" label="Username" placeholder="Enter username" />);

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Input id="email" label="Email" error="Invalid email address" />);

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('handles focus and blur events', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();

    render(<Input id="test-input" onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByRole('textbox');

    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('handles showPicker on click for date or time input', () => {
    const onClick = vi.fn();
    const showPickerMock = vi.fn();

    render(<Input id="date-input" type="date" label="Select Date" onClick={onClick} />);
    const input = screen.getByLabelText('Select Date');
    input.showPicker = showPickerMock;

    fireEvent.click(input);

    expect(showPickerMock).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  it('handles showPicker when label of date input is clicked', () => {
    const showPickerMock = vi.fn();

    render(<Input id="time-input" type="time" label="Select Time" />);
    const input = screen.getByLabelText('Select Time');
    input.showPicker = showPickerMock;

    const label = screen.getByText('Select Time');
    fireEvent.click(label);

    expect(showPickerMock).toHaveBeenCalled();
  });
});

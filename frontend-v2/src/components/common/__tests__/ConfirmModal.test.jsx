import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal Component', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Delete Flight"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, description, icon badge, custom children, and buttons when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking?"
        icon="warning"
        variant="danger"
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      >
        <p data-testid="custom-child">PNR: ABCDEF</p>
      </ConfirmModal>
    );

    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to cancel this booking?')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Yes, Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
  });

  it('triggers onConfirm and onCancel when buttons are clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        title="Confirm Action"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('triggers onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmModal
        isOpen={true}
        title="Confirm Action"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const backdrop = document.querySelector('.modal-backdrop');
    fireEvent.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TableSkeletonLoader, SpinnerLoader } from '../Loaders';

describe('Loaders Component', () => {
  describe('TableSkeletonLoader', () => {
    it('renders default number of skeleton rows (5)', () => {
      const { container } = render(<TableSkeletonLoader />);
      const rows = container.querySelectorAll('.skeleton-row');
      expect(rows.length).toBe(5);
    });

    it('renders custom number of skeleton rows', () => {
      const { container } = render(<TableSkeletonLoader rows={10} />);
      const rows = container.querySelectorAll('.skeleton-row');
      expect(rows.length).toBe(10);
    });
  });

  describe('SpinnerLoader', () => {
    it('renders admin spinner wrapper when size is not provided', () => {
      const { container } = render(<SpinnerLoader />);
      expect(container.querySelector('.admin-spinner-wrap')).toBeInTheDocument();
      expect(container.querySelector('.admin-spinner')).toBeInTheDocument();
    });

    it('renders lucide icon loader when size prop is provided', () => {
      const { container } = render(<SpinnerLoader size={24} className="custom-spin" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
      expect(svg).toHaveClass('custom-spin');
    });
  });
});

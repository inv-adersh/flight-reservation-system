import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination Component', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalCount={5} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders result range and page buttons correctly', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalCount={50}
        pageSize={10}
        onPageChange={vi.fn()}
        entityLabel="flights"
      />
    );

    expect(screen.getByText((_, element) => element?.tagName?.toLowerCase() === 'p' && element?.textContent?.includes('Showing 11–20 of 50 flights'))).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('handles prev and next page clicks', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalCount={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables Prev button on first page and Next button on last page', () => {
    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalCount={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    const prevBtn = document.getElementById('pagination-prev');
    expect(prevBtn).toBeDisabled();

    rerender(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalCount={50}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    const nextBtn = document.getElementById('pagination-next');
    expect(nextBtn).toBeDisabled();
  });

  it('renders ellipsis for large page counts', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        totalCount={100}
        pageSize={10}
        onPageChange={vi.fn()}
      />
    );

    const ellipses = screen.getAllByText('…');
    expect(ellipses.length).toBeGreaterThan(0);
  });
});

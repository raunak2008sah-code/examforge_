import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key="1"
          className="ef-button ef-button-secondary"
          onClick={() => onPageChange(1)}
          style={{ padding: 'var(--space-1) var(--space-3)' }}
        >
          1
        </button>,
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots-start" style={{ color: 'var(--text-secondary)' }}>
            <MoreHorizontal size={16} />
          </span>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`ef-button ${currentPage === i ? 'ef-button-primary' : 'ef-button-secondary'}`}
          onClick={() => onPageChange(i)}
          style={{ padding: 'var(--space-1) var(--space-3)' }}
        >
          {i}
        </button>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots-end" style={{ color: 'var(--text-secondary)' }}>
            <MoreHorizontal size={16} />
          </span>,
        );
      }
      pages.push(
        <button
          key={totalPages}
          className="ef-button ef-button-secondary"
          onClick={() => onPageChange(totalPages)}
          style={{ padding: 'var(--space-1) var(--space-3)' }}
        >
          {totalPages}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) 0',
      }}
    >
      <div className="text-meta">
        Page {currentPage} of {totalPages}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          className="ef-button ef-button-secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ padding: 'var(--space-1) var(--space-2)' }}
        >
          <ChevronLeft size={16} />
        </button>

        {renderPageButtons()}

        <button
          className="ef-button ef-button-secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ padding: 'var(--space-1) var(--space-2)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

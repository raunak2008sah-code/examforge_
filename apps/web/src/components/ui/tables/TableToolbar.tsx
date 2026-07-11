import React from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';

export function TableToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {children}
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative', width: '300px' }}>
      <div
        style={{
          position: 'absolute',
          left: 'var(--space-3)',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)',
        }}
      >
        <Search size={16} />
      </div>
      <input
        type="text"
        className="ef-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 'var(--space-7)' }}
      />
    </div>
  );
}

export function FilterBar({ label = 'Filter', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button className="ef-button ef-button-secondary" onClick={onClick}>
      <Filter size={16} />
      <span>{label}</span>
    </button>
  );
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onClear,
}: {
  selectedCount: number;
  onDelete?: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        backgroundColor: 'rgba(59, 110, 165, 0.1)',
        border: '1px solid var(--state-info)',
        padding: 'var(--space-2) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <span className="text-body" style={{ fontWeight: 500, color: 'var(--state-info)' }}>
        {selectedCount} selected
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button
          className="ef-button ef-button-secondary"
          onClick={onClear}
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          Clear
        </button>
        {onDelete && (
          <button
            className="ef-button ef-button-danger"
            onClick={onDelete}
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="ef-table-container">
      <table className="ef-table">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="ef-tr">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  isSelected = false,
  onClick,
}: {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      className="ef-tr"
      onClick={onClick}
      style={{
        backgroundColor: isSelected ? 'rgba(43, 58, 103, 0.05)' : undefined,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  isHeader = false,
  align = 'left',
  width,
}: {
  children: React.ReactNode;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}) {
  const Component = isHeader ? 'th' : 'td';
  const className = isHeader ? 'ef-th' : 'ef-td';

  return (
    <Component className={className} style={{ textAlign: align, width }}>
      {children}
    </Component>
  );
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
}: {
  label: React.ReactNode;
  sortKey: string;
  currentSort?: string;
  direction?: 'asc' | 'desc';
  onSort: (key: string) => void;
}) {
  const isActive = currentSort === sortKey;

  return (
    <th
      className="ef-th"
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {label}
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            opacity: isActive ? 1 : 0.3,
          }}
        >
          {isActive && direction === 'asc' ? (
            <ChevronUp size={14} />
          ) : isActive && direction === 'desc' ? (
            <ChevronDown size={14} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '14px',
                justifyContent: 'center',
              }}
            >
              <ChevronUp size={10} style={{ marginBottom: '-4px' }} />
              <ChevronDown size={10} />
            </div>
          )}
        </span>
      </div>
    </th>
  );
}

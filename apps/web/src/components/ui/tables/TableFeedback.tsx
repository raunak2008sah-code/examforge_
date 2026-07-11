import React from 'react';
import { Inbox } from 'lucide-react';
import { LoadingSkeleton } from '@/components/admin/feedback/LoadingSkeleton';

export function EmptyTableState({
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      <Inbox size={32} style={{ marginBottom: 'var(--space-3)', opacity: 0.5 }} />
      <h3
        className="text-body"
        style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}
      >
        {title}
      </h3>
      <p className="text-meta">{description}</p>
    </div>
  );
}

export function LoadingTableSkeleton({
  columns = 4,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="ef-table-container">
      <table className="ef-table">
        <thead>
          <tr className="ef-tr">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="ef-th">
                <LoadingSkeleton width="60%" height="16px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="ef-tr">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="ef-td">
                  <LoadingSkeleton width={j === 0 ? '80%' : '40%'} height="16px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
import { LoadingSkeleton as BaseSkeleton } from '@/components/admin/feedback/LoadingSkeleton';

export function FormSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <BaseSkeleton width="120px" height="16px" />
          <BaseSkeleton width="100%" height="40px" />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
        <BaseSkeleton width="100px" height="36px" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <BaseSkeleton width="60%" height="24px" />
      <BaseSkeleton width="100%" height="16px" />
      <BaseSkeleton width="80%" height="16px" />
      <div style={{ marginTop: 'var(--space-4)' }}>
        <BaseSkeleton width="80px" height="32px" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BaseSkeleton width="250px" height="32px" />
        <BaseSkeleton width="120px" height="36px" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div style={{ flex: 1 }}>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

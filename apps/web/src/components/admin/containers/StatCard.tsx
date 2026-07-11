import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--elevation-1)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}
      >
        <span className="text-meta" style={{ fontWeight: 500 }}>
          {title}
        </span>
        {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span className="text-display" style={{ marginBottom: 0 }}>
          {value}
        </span>
        {trend && (
          <span
            className="text-meta"
            style={{ color: trend.isPositive ? 'var(--state-success)' : 'var(--state-error)' }}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        backgroundColor: 'var(--bg-sunken)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          color: 'var(--text-secondary)',
          boxShadow: 'var(--elevation-1)',
        }}
      >
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>
        {title}
      </h3>
      <p
        className="text-meta"
        style={{
          maxWidth: '400px',
          marginBottom: action ? 'var(--space-5)' : 0,
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

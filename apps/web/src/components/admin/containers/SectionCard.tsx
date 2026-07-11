import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function SectionCard({ title, description, children, actions }: SectionCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--elevation-1)',
        overflow: 'hidden',
        marginBottom: 'var(--space-4)',
      }}
    >
      {(title || description || actions) && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            {title && (
              <h2 className="text-h2" style={{ marginBottom: description ? 'var(--space-1)' : 0 }}>
                {title}
              </h2>
            )}
            {description && <p className="text-meta">{description}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding: 'var(--space-5)' }}>{children}</div>
    </div>
  );
}

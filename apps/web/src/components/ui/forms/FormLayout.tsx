import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h3 className="text-h2" style={{ marginBottom: 'var(--space-1)' }}>
          {title}
        </h3>
        {description && <p className="text-meta">{description}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {children}
      </div>
    </div>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'flex-end',
        marginTop: 'var(--space-6)',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </div>
  );
}

export function ValidationMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: 'var(--state-error)',
        backgroundColor: 'rgba(179, 38, 30, 0.1)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <AlertTriangle size={18} />
      <span className="text-body" style={{ fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
}

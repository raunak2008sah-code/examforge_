import React from 'react';

export function PageContainer({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="container-admin">
      {title && <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{title}</h1>}
      {children}
    </div>
  );
}

import React from 'react';

interface ActionBarProps {
  children: React.ReactNode;
  position?: 'sticky' | 'fixed' | 'static';
}

export function ActionBar({ children, position = 'static' }: ActionBarProps) {
  return (
    <div
      style={{
        position: position,
        bottom: position === 'fixed' ? 'var(--space-6)' : 'auto',
        top: position === 'sticky' ? 'var(--space-4)' : 'auto',
        zIndex: position !== 'static' ? 'var(--z-sticky)' : 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--elevation-2)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {children}
    </div>
  );
}

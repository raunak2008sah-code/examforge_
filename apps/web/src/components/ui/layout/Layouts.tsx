import React from 'react';

export function SplitPane({
  left,
  right,
  leftWidth = '50%',
  rightWidth = '50%',
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
}) {
  return (
    <div className="ef-split-pane" style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div
        style={{
          width: leftWidth,
          overflowY: 'auto',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {left}
      </div>
      <div style={{ width: rightWidth, overflowY: 'auto' }}>{right}</div>
    </div>
  );
}

export function DetailPanel({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 className="text-h2" style={{ margin: 0 }}>
          {title}
        </h2>
        {actions && <div>{actions}</div>}
      </div>
      <div style={{ padding: 'var(--space-5)', flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

export function ResponsiveGrid({
  children,
  minChildWidth = '300px',
}: {
  children: React.ReactNode;
  minChildWidth?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minChildWidth}, 1fr))`,
        gap: 'var(--space-4)',
      }}
    >
      {children}
    </div>
  );
}

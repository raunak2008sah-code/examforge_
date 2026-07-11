import React from 'react';
import Link from 'next/link';

export function SecondaryNavigation({
  items,
}: {
  items: { label: string; href: string; isActive?: boolean }[];
}) {
  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        width: '100%',
      }}
    >
      {items.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: item.isActive ? 'rgba(43, 58, 103, 0.1)' : 'transparent',
            color: item.isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: item.isActive ? 600 : 500,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color var(--motion-fast)',
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', width = '220px' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-1))',
            left: align === 'left' ? 0 : 'auto',
            right: align === 'right' ? 0 : 'auto',
            width,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--elevation-2)',
            zIndex: 'var(--z-dropdown)',
            padding: 'var(--space-1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {items.map((item, i) => {
            if (item.label === 'DIVIDER') {
              return (
                <div
                  key={i}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--border-subtle)',
                    margin: 'var(--space-1) 0',
                  }}
                />
              );
            }

            const Component = item.href ? 'a' : 'button';
            const props = item.href
              ? { href: item.href }
              : {
                  onClick: () => {
                    item.onClick?.();
                    setIsOpen(false);
                  },
                };

            return (
              <Component
                key={i}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(props as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: item.danger ? 'var(--state-error)' : 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '14px',
                  textDecoration: 'none',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = item.danger
                    ? 'rgba(179, 38, 30, 0.1)'
                    : 'rgba(0,0,0,var(--opacity-hover-overlay))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {item.icon && <span style={{ opacity: 0.7 }}>{item.icon}</span>}
                <span style={{ flex: 1 }}>{item.label}</span>
              </Component>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Popover and ContextMenu share the exact same logic but with different trigger mechanisms/positioning.
// In a full implementation, they would use a positioning engine like Floating UI.
// For this baseline, we use the DropdownMenu as the underlying pattern.

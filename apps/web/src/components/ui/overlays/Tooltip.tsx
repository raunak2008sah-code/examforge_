'use client';

import React, { useState, useRef } from 'react';

export function Tooltip({
  content,
  children,
  position = 'top',
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: 'calc(100% + 4px)', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { left: 'calc(100% + 4px)', top: '50%', transform: 'translateY(-50%)' };
      case 'top':
      default:
        return { bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            ...getPositionStyles(),
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-surface)',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 'var(--z-tooltip)',
            pointerEvents: 'none',
            boxShadow: 'var(--elevation-1)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

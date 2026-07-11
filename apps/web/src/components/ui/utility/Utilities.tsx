/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(31, 122, 77, 0.1)', color: 'var(--state-success)' };
      case 'warning':
        return { bg: 'rgba(166, 121, 12, 0.1)', color: 'var(--accent-amber)' };
      case 'error':
        return { bg: 'rgba(179, 38, 30, 0.1)', color: 'var(--state-error)' };
      case 'info':
        return { bg: 'rgba(59, 110, 165, 0.1)', color: 'var(--state-info)' };
      default:
        return { bg: 'var(--bg-sunken)', color: 'var(--text-secondary)' };
    }
  };

  const { bg, color } = getStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function Chip({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '13px',
        backgroundColor: 'var(--bg-sunken)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>×</span>
        </button>
      )}
    </span>
  );
}

export function Avatar({
  src,
  initials,
  size = 40,
}: {
  src?: string;
  initials?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--brand-secondary)',
        color: 'var(--brand-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.4,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {src ? (
        <img src={src} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials?.substring(0, 2).toUpperCase()
      )}
    </div>
  );
}

export function IconButton({
  icon,
  onClick,
  title,
  variant = 'secondary',
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const getClassName = () => {
    switch (variant) {
      case 'primary':
        return 'ef-button ef-button-primary';
      case 'danger':
        return 'ef-button ef-button-danger';
      case 'ghost':
        return 'ef-button'; // fallback without border
      default:
        return 'ef-button ef-button-secondary';
    }
  };

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      title={title}
      style={{
        padding: 'var(--space-2)', // square padding
        ...(variant === 'ghost' ? { backgroundColor: 'transparent', border: 'none' } : {}),
      }}
    >
      {icon}
    </button>
  );
}

export function Divider() {
  return (
    <div
      style={{
        height: '1px',
        width: '100%',
        backgroundColor: 'var(--border-subtle)',
        margin: 'var(--space-4) 0',
      }}
    />
  );
}

export function KeyValueDisplay({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-2)' }}>
      <div className="text-meta" style={{ marginBottom: '2px' }}>
        {label}
      </div>
      <div className="text-body" style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <button
      className="ef-button ef-button-secondary"
      onClick={handleCopy}
      style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '12px' }}
    >
      {copied ? <Check size={14} color="var(--state-success)" /> : <Copy size={14} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

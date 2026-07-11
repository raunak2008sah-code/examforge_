import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertOctagon } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  showIcon?: boolean;
}

export function StatusBadge({ label, variant, showIcon = true }: StatusBadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(31, 122, 77, 0.1)', color: 'var(--state-success)', icon: CheckCircle2 };
      case 'warning':
        return { bg: 'rgba(166, 121, 12, 0.1)', color: 'var(--accent-amber)', icon: AlertTriangle };
      case 'error':
        return { bg: 'rgba(179, 38, 30, 0.1)', color: 'var(--state-error)', icon: AlertOctagon };
      case 'info':
        return { bg: 'rgba(59, 110, 165, 0.1)', color: 'var(--state-info)', icon: Clock };
      case 'default':
      default:
        return { bg: 'var(--bg-sunken)', color: 'var(--text-secondary)', icon: null };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '13px',
        fontWeight: 500,
        backgroundColor: styles.bg,
        color: styles.color,
      }}
    >
      {showIcon && Icon && <Icon size={14} />}
      {label}
    </span>
  );
}

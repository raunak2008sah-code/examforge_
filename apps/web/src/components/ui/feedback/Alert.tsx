import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  icon?: boolean;
}

export function Alert({ title, children, variant = 'info', icon = true }: AlertProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'rgba(31, 122, 77, 0.1)',
          color: 'var(--state-success)',
          border: 'var(--state-success)',
          Icon: CheckCircle,
        };
      case 'warning':
        return {
          bg: 'rgba(166, 121, 12, 0.1)',
          color: 'var(--accent-amber)',
          border: 'var(--accent-amber)',
          Icon: AlertTriangle,
        };
      case 'error':
        return {
          bg: 'rgba(179, 38, 30, 0.1)',
          color: 'var(--state-error)',
          border: 'var(--state-error)',
          Icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'rgba(59, 110, 165, 0.1)',
          color: 'var(--state-info)',
          border: 'var(--state-info)',
          Icon: Info,
        };
    }
  };

  const { bg, color, border, Icon } = getVariantStyles();

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        backgroundColor: bg,
        borderLeft: `4px solid ${border}`,
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {icon && (
        <div style={{ color, marginTop: title ? '2px' : '0' }}>
          <Icon size={20} />
        </div>
      )}
      <div>
        {title && (
          <h4 style={{ color, fontWeight: 600, marginBottom: 'var(--space-1)' }}>{title}</h4>
        )}
        <div className="text-body" style={{ color: 'var(--text-primary)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Banner({
  children,
  variant = 'info',
}: {
  children: React.ReactNode;
  variant?: AlertVariant;
}) {
  // Simpler banner implementation

  const getBannerColor = () => {
    switch (variant) {
      case 'error':
        return 'var(--state-error)';
      case 'success':
        return 'var(--state-success)';
      case 'warning':
        return 'var(--accent-amber)';
      default:
        return 'var(--brand-primary)';
    }
  };

  return (
    <div
      style={{
        backgroundColor: getBannerColor(),
        color: 'white',
        padding: 'var(--space-2) var(--space-4)',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

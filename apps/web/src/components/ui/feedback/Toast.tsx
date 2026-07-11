'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

export function ToastItem({
  id,
  title,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle size={20} color="var(--state-success)" />;
      case 'error':
        return <AlertCircle size={20} color="var(--state-error)" />;
      case 'warning':
        return <AlertTriangle size={20} color="var(--accent-amber)" />;
      default:
        return <Info size={20} color="var(--state-info)" />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--elevation-2)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        pointerEvents: 'auto',
        width: '320px',
        animation: 'slideIn var(--motion-base)',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <h4 className="text-body" style={{ fontWeight: 600, margin: 0 }}>
          {title}
        </h4>
        {message && (
          <p className="text-meta" style={{ marginTop: 'var(--space-1)' }}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 'var(--space-1)',
          height: 'fit-content',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// In a real app, you'd use a Context provider to manage toasts globally.
// This is a simplified placeholder structure.
export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: {
    id: string;
    title: string;
    message?: string;
    variant?: ToastVariant;
    duration?: number;
  }[];
  onClose: (id: string) => void;
}) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        zIndex: 'var(--z-toast)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
}

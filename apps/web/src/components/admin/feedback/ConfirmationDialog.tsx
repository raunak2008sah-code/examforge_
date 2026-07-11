'use client';

import React, { useEffect, useRef } from 'react';
import { AlertOctagon } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      style={{
        padding: 0,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--elevation-2)',
        maxWidth: 'var(--container-modal)',
        width: '100%',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          {isDestructive && (
            <div
              style={{
                color: 'var(--state-error)',
                backgroundColor: 'rgba(179, 38, 30, 0.1)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <AlertOctagon size={24} />
            </div>
          )}
          <div>
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>
              {title}
            </h2>
            <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-6)',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isDestructive ? 'var(--state-error)' : 'var(--brand-primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

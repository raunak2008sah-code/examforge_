'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  width?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
  width = '400px',
}: DrawerProps) {
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
      className="ef-dialog-backdrop"
      style={{
        margin: 0,
        height: '100%',
        maxHeight: '100%',
        width,
        maxWidth: '100%',
        position: 'fixed',
        left: position === 'left' ? 0 : 'auto',
        right: position === 'right' ? 0 : 'auto',
        top: 0,
        bottom: 0,
        border: 'none',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--elevation-2)',
        padding: 0,
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="ef-modal-header" style={{ flexShrink: 0 }}>
        <h2 className="text-h2" style={{ margin: 0 }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className="ef-button ef-button-secondary"
          style={{ padding: 'var(--space-1)' }}
        >
          <X size={20} />
        </button>
      </div>

      <div className="ef-modal-body" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>

      {footer && (
        <div className="ef-modal-footer" style={{ flexShrink: 0 }}>
          {footer}
        </div>
      )}
    </dialog>
  );
}

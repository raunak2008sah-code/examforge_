'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth }: ModalProps) {
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
      className="ef-modal ef-dialog-backdrop"
      style={{ maxWidth: maxWidth || 'var(--container-modal)' }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isInDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width;
        if (!isInDialog) onClose();
      }}
    >
      {title && (
        <div className="ef-modal-header">
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
      )}

      {!title && (
        <button
          onClick={onClose}
          className="ef-button ef-button-secondary"
          style={{
            position: 'absolute',
            right: 'var(--space-4)',
            top: 'var(--space-4)',
            padding: 'var(--space-1)',
          }}
        >
          <X size={20} />
        </button>
      )}

      <div className="ef-modal-body">{children}</div>

      {footer && <div className="ef-modal-footer">{footer}</div>}
    </dialog>
  );
}

import React, { forwardRef } from 'react';
import { Spinner } from '../feedback/Loader';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', isLoading = false, className, disabled, ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'secondary':
          return 'ef-button-secondary';
        case 'danger':
          return 'ef-button-danger';
        case 'primary':
        default:
          return 'ef-button-primary';
      }
    };

    return (
      <button
        ref={ref}
        className={`ef-button ${getVariantClass()} ${className || ''}`}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Saving...
          </span>
        )}
        {isLoading ? <Spinner size={16} color="currentColor" /> : null}
        {!isLoading && children}
      </button>
    );
  },
);

Button.displayName = 'Button';

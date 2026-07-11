import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);

    return (
      <div className="ef-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="ef-label">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`ef-input ${error ? 'ef-input-error' : ''} ${className || ''}`}
          style={{ minHeight: '100px', resize: 'vertical' }}
          {...props}
        />
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
TextArea.displayName = 'TextArea';

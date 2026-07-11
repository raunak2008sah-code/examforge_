import React, { forwardRef } from 'react';

interface Option {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);

    return (
      <div className="ef-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="ef-label">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`ef-input ${error ? 'ef-input-error' : ''} ${className || ''}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
Select.displayName = 'Select';

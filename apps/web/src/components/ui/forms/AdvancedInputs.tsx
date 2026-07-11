import React, { forwardRef } from 'react';
import { UploadCloud } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;

    return (
      <div className="ef-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="ef-label">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type="date"
          className={`ef-input ${error ? 'ef-input-error' : ''} ${className || ''}`}
          {...props}
        />
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';

export const TimePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;

    return (
      <div className="ef-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="ef-label">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          type="time"
          className={`ef-input ${error ? 'ef-input-error' : ''} ${className || ''}`}
          {...props}
        />
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
TimePicker.displayName = 'TimePicker';

export const FileUploadField = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className, id, onChange, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;
    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setFileName(file.name);
      else setFileName(null);
      if (onChange) onChange(e);
    };

    return (
      <div className="ef-input-wrapper">
        {label && <span className="ef-label">{label}</span>}
        <label
          htmlFor={inputId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            border: `2px dashed ${error ? 'var(--state-error)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-sunken)',
            cursor: 'pointer',
            transition: 'border-color var(--motion-fast)',
          }}
          className={className}
        >
          <UploadCloud
            size={24}
            style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}
          />
          <span className="text-body" style={{ fontWeight: 500 }}>
            {fileName || 'Click or drag file to upload'}
          </span>
          {!fileName && <span className="text-meta">Max file size: 10MB</span>}
          <input
            id={inputId}
            ref={ref}
            type="file"
            onChange={handleChange}
            style={{ display: 'none' }}
            {...props}
          />
        </label>
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
FileUploadField.displayName = 'FileUploadField';

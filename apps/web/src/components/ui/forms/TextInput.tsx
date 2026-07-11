import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
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
          className={`ef-input ${error ? 'ef-input-error' : ''} ${className || ''}`}
          {...props}
        />
        {error && <span className="ef-error-text">{error}</span>}
        {helperText && !error && <span className="ef-help-text">{helperText}</span>}
      </div>
    );
  },
);
TextInput.displayName = 'TextInput';

export const PasswordField = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        style={{ paddingRight: 'var(--space-7)' }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: 'absolute',
          right: 'var(--space-3)',
          top: props.label ? 'calc(14px + var(--space-3) + 2px)' : 'calc(50% - 10px)',
          color: 'var(--text-secondary)',
        }}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
});
PasswordField.displayName = 'PasswordField';

export const NumberField = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  return <TextInput {...props} ref={ref} type="number" />;
});
NumberField.displayName = 'NumberField';

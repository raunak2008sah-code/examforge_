import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <input type="checkbox" id={inputId} ref={ref} style={{ marginTop: '4px' }} {...props} />
        <div>
          <label htmlFor={inputId} className="ef-label" style={{ cursor: 'pointer' }}>
            {label}
          </label>
          {description && <p className="text-meta">{description}</p>}
          {error && <span className="ef-error-text">{error}</span>}
        </div>
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export const RadioGroup = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
}: {
  label?: string;
  name: string;
  options: { label: string; value: string }[];
  value?: string;
  onChange: (val: string) => void;
  error?: string;
}) => {
  return (
    <div className="ef-input-wrapper">
      {label && <span className="ef-label">{label}</span>}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-1)',
        }}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="text-body">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <span className="ef-error-text">{error}</span>}
    </div>
  );
};

export const ToggleSwitch = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <label
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '40px',
            height: '24px',
          }}
        >
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            style={{ opacity: 0, width: 0, height: 0 }}
            {...props}
          />
          <span
            style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: props.checked ? 'var(--brand-primary)' : 'var(--border-subtle)',
              transition: 'var(--motion-fast)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '""',
                height: '18px',
                width: '18px',
                left: props.checked ? '18px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: 'var(--motion-fast)',
                borderRadius: '50%',
              }}
            />
          </span>
        </label>
        <div>
          <span className="ef-label" style={{ cursor: 'pointer' }}>
            {label}
          </span>
          {description && (
            <p className="text-meta" style={{ margin: 0 }}>
              {description}
            </p>
          )}
        </div>
      </div>
    );
  },
);
ToggleSwitch.displayName = 'ToggleSwitch';

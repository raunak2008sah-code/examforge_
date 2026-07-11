import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStepId: string;
}

export function Stepper({ steps, currentStepId }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        marginBottom: 'var(--space-6)',
      }}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted
                    ? 'var(--state-success)'
                    : isActive
                      ? 'var(--brand-primary)'
                      : 'var(--bg-sunken)',
                  color: isCompleted || isActive ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: isUpcoming ? '1px solid var(--border-subtle)' : 'none',
                  boxShadow: isActive ? `0 0 0 4px rgba(43, 58, 103, 0.1)` : 'none',
                }}
              >
                {isCompleted ? <Check size={18} /> : index + 1}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                <div
                  className="text-meta"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {step.label}
                </div>
                {step.description && isActive && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isCompleted ? 'var(--state-success)' : 'var(--border-subtle)',
                  margin: '0 var(--space-2)',
                  marginTop: '-16px', // Align with the center of the 32px circle (not counting the text below)
                  zIndex: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

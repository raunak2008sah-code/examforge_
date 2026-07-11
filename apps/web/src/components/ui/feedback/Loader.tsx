import React from 'react';

export function ProgressBar({
  progress,
  showLabel = false,
}: {
  progress: number; // 0 to 100
  showLabel?: boolean;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: '8px',
          width: '100%',
          backgroundColor: 'var(--bg-sunken)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clampedProgress}%`,
            backgroundColor: 'var(--brand-primary)',
            transition: 'width var(--motion-base)',
          }}
        />
      </div>
      {showLabel && (
        <div className="text-meta" style={{ textAlign: 'right', marginTop: 'var(--space-1)' }}>
          {clampedProgress}%
        </div>
      )}
    </div>
  );
}

export function Spinner({
  size = 24,
  color = 'var(--brand-primary)',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div
      className="ef-spinner"
      style={{
        width: size,
        height: size,
        border: `3px solid rgba(0,0,0,0.1)`,
        borderTopColor: color,
        borderRadius: '50%',
      }}
    >
      <style>{`
        .ef-spinner {
          animation: ef-spin 1s linear infinite;
        }
        @keyframes ef-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ef-spinner { animation: none; }
        }
      `}</style>
    </div>
  );
}

export function InlineLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: 'var(--text-secondary)',
      }}
    >
      <Spinner size={16} color="currentColor" />
      <span className="text-meta">{text}</span>
    </div>
  );
}

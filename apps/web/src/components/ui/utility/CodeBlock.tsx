import React from 'react';
import { CopyButton } from './Utilities';

export function CodeBlock({
  code,
  language = 'json',
  maxHeight,
}: {
  code: string;
  language?: string;
  maxHeight?: string;
}) {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#1E1E1E', // Always dark for code blocks to stand out
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-2) var(--space-4)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontSize: '12px', color: '#A0A0A0', fontFamily: 'monospace' }}>
          {language}
        </span>
        <CopyButton text={code} label="Copy Code" />
      </div>
      <div
        style={{
          padding: 'var(--space-4)',
          overflowX: 'auto',
          maxHeight: maxHeight,
          overflowY: maxHeight ? 'auto' : 'visible',
        }}
      >
        <pre style={{ margin: 0, padding: 0 }}>
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#D4D4D4',
              whiteSpace: 'pre',
            }}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

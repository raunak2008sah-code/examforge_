import React from 'react';

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleColor = (r: string) => {
    switch (r.toUpperCase()) {
      case 'ADMIN':
        return { bg: 'var(--state-error)', color: 'white' };
      case 'REVIEWER':
        return { bg: 'var(--state-info)', color: 'white' };
      case 'STUDENT':
        return { bg: 'var(--bg-sunken)', color: 'var(--text-primary)' };
      default:
        return { bg: 'var(--bg-sunken)', color: 'var(--text-primary)' };
    }
  };

  const style = getRoleColor(role);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {role}
    </span>
  );
}

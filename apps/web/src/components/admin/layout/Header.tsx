import React from 'react';
import { LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  user: {
    email: string;
    role: string;
  };
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="admin-header">
      <div className="admin-header-breadcrumbs" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="admin-header-mobile-toggle" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={24} />
        </button>
        {/* Breadcrumb component will go here later if we want global breadcrumbs */}
      </div>

      <div
        className="admin-header-actions"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
      >
        <div className="admin-header-user-info" style={{ textAlign: 'right' }}>
          <div className="text-body" style={{ fontWeight: 500 }}>
            {user.email}
          </div>
          <div className="text-meta">{user.role}</div>
        </div>
        <button
          title="Sign out"
          onClick={async () => {
            const { authClient } = await import('@/lib/auth-client');
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = '/login';
                },
              },
            });
          }}
          style={{
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

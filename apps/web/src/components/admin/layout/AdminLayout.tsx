'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import '@/styles/admin.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    email: string;
    role: string;
  };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout-root">
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 'calc(var(--z-modal) - 1)',
          }}
        />
      )}

      <div className="admin-main-content">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-page-content">{children}</main>
      </div>
    </div>
  );
}

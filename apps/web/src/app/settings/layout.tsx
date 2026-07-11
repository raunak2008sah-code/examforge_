import React from 'react';
import { authService } from '../../server/auth/auth-service';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, Shield, Key } from 'lucide-react';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await authService.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const navItems = [
    { name: 'Profile', href: '/settings/profile', icon: User },
    { name: 'Security', href: '/settings/security', icon: Shield },
    { name: 'Sessions', href: '/settings/sessions', icon: Key },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Navbar */}
      <nav style={{ 
        backgroundColor: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border-subtle)', 
        padding: 'var(--space-4) var(--space-6)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          ExamForge
          <span style={{ 
            color: 'var(--brand-primary)', 
            backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: 600, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em' 
          }}>
            Settings
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <Link href={session.user.role === 'STUDENT' ? '/student' : '/admin'} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-text-primary">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main style={{ padding: 'var(--space-6) var(--space-8)', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: 'var(--space-8)' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all var(--motion-fast)',
                  }}
                  className="hover-bg-surface-active hover-text-primary"
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          {children}
        </div>
      </main>

      {/* Basic styles for hover states since we are using inline styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-text-primary:hover { color: var(--text-primary) !important; }
        .hover-bg-surface-active:hover { background-color: var(--bg-surface-hover) !important; }
      `}} />
    </div>
  );
}

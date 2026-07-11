'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';
import { Monitor, Smartphone, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SessionData {
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  updatedAt: Date;
}

export interface SessionsClientProps {
  sessions: SessionData[];
  currentSessionToken: string;
}

export function SessionsClient({ sessions: initialSessions, currentSessionToken }: SessionsClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);
  const [isLoading, setIsLoading] = useState<string | null>(null); // holds token being revoked
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRevoke = async (token: string) => {
    setIsLoading(token);
    setMessage(null);

    try {
      const { error } = await authClient.revokeSession({ token });
      
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to revoke session.' });
      } else {
        setSessions(prev => prev.filter(s => s.token !== token));
        setMessage({ type: 'success', text: 'Session revoked successfully.' });
        
        // If they revoked their own session, they should be logged out
        if (token === currentSessionToken) {
          router.push('/login');
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(null);
    }
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { device: 'Unknown Device', icon: Globe };
    const lower = ua.toLowerCase();
    if (lower.includes('mobi') || lower.includes('android') || lower.includes('iphone')) {
      return { device: 'Mobile Device', icon: Smartphone };
    }
    if (lower.includes('macintosh') || lower.includes('windows') || lower.includes('linux')) {
      return { device: 'Desktop Browser', icon: Monitor };
    }
    return { device: 'Unknown Device', icon: Globe };
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="text-h4" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Active Sessions</h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Manage the devices currently logged into your account.</p>
      </div>

      {message && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Alert variant={message.type} title={message.type === 'success' ? 'Success' : 'Error'}>
            {message.text}
          </Alert>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {sessions.map((session) => {
          const isCurrent = session.token === currentSessionToken;
          const { device, icon: DeviceIcon } = parseUserAgent(session.userAgent);
          
          return (
            <div key={session.token} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
                  <DeviceIcon className="w-6 h-6" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {device}
                    {isCurrent && (
                      <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: 'var(--brand-primary)', color: 'white', borderRadius: '4px', fontWeight: 600 }}>
                        Current
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {session.ipAddress || 'Unknown IP'} • Last active: {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="danger" 
                onClick={() => handleRevoke(session.token)}
                isLoading={isLoading === session.token}
                disabled={isLoading !== null}
              >
                {isCurrent ? 'Log out' : 'Revoke'}
              </Button>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No active sessions found.</p>
        )}
      </div>
    </div>
  );
}

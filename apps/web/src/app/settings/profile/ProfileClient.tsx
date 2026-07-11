'use client';

import React, { useState, useEffect } from 'react';
import { TextInput } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';
import { User as UserIcon } from 'lucide-react';

export function ProfileClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (data?.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
        }
      } finally {
        setIsFetching(false);
      }
    };
    fetchSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await authClient.updateUser({
        name,
        // email updates might require extra verification steps depending on Better Auth config, so we will just update name for now
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="text-h4" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Profile Settings</h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Update your personal information.</p>
      </div>

      {message && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Alert variant={message.type} title={message.type === 'success' ? 'Success' : 'Error'}>
            {message.text}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
            <UserIcon className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Profile Picture</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Managed via Gravatar or third-party auth.</p>
          </div>
        </div>

        <TextInput
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <TextInput
          label="Email Address"
          type="email"
          value={email}
          disabled={true}
          helperText="Email address cannot be changed directly."
        />
        
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

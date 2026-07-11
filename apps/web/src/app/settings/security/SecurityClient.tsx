'use client';

import React, { useState } from 'react';
import { PasswordField } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

export function SecurityClient() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true, // Optional: log out of other devices on password change
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to change password. Ensure current password is correct.' });
      } else {
        setMessage({ type: 'success', text: 'Password changed successfully! Other sessions have been revoked.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 className="text-h4" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>Security Settings</h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Manage your password and account security.</p>
      </div>

      {message && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Alert variant={message.type} title={message.type === 'success' ? 'Success' : 'Error'}>
            {message.text}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '500px' }}>
        <PasswordField
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <PasswordField
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <PasswordField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Change Password
          </Button>
        </div>
      </form>
    </div>
  );
}

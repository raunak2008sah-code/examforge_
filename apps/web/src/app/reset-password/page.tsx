'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { PasswordField } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // Better Auth also checks URL natively, but good to ensure it exists
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to reset password. The link might be expired.' });
      } else {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting...' });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--brand-primary)' }} />
          <h1 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Reset Password</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Enter your new password below.</p>
        </div>

        {message && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant={message.type} title={message.type === 'success' ? 'Success' : 'Error'}>
              {message.text}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <PasswordField
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading || message?.type === 'success'}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading || message?.type === 'success'}
          />
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLoading}
            disabled={message?.type === 'success' || !token}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Reset Password
          </Button>

          {!token && !message && (
            <p style={{ color: 'var(--status-danger)', fontSize: '0.875rem', marginTop: 'var(--space-2)', textAlign: 'center' }}>
              Invalid or missing reset token.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

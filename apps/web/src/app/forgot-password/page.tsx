'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { TextInput } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { data, error } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to send reset email.' });
      } else {
        setMessage({ type: 'success', text: 'If an account exists, a reset link has been sent.' });
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
          <KeyRound className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--brand-primary)' }} />
          <h1 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Forgot Password</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Enter your email to receive a reset link.</p>
        </div>

        {message && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant={message.type} title={message.type === 'success' ? 'Email Sent' : 'Error'}>
              {message.text}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@examforge.com"
            required
            disabled={isLoading || message?.type === 'success'}
          />
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLoading}
            disabled={message?.type === 'success'}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Send Reset Link
          </Button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

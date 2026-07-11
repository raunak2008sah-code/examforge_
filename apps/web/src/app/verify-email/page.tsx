'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResend = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setMessage(null);
    try {
      const { data, error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: '/student' // Redirect here after they click the link in email
      });
      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to resend email.' });
      } else {
        setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-8) var(--space-6)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
        <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
        
        <h1 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Check your email
        </h1>
        
        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email address'}</strong>.
          Please verify your account to continue.
        </p>

        {message && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <Alert variant={message.type} title={message.type === 'success' ? 'Email Sent' : 'Error'}>
              {message.text}
            </Alert>
          </div>
        )}

        <Button 
          variant="secondary" 
          onClick={handleResend} 
          isLoading={isLoading}
          disabled={!email || isLoading}
          style={{ width: '100%' }}
        >
          Resend Verification Email
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

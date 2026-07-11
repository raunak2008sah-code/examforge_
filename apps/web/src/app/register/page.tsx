'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TextInput, PasswordField } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message || 'Registration failed. Please try again.');
        return;
      }

      // Automatically sign in or redirect to verification page
      // Because we configured sendOnSignUp: true and autoSignInAfterVerification: true,
      // the user might not be fully active until they verify email.
      // Better Auth redirects or returns success.
      router.push('/verify-email?email=' + encodeURIComponent(email));
    } catch (err: unknown) {
      setError((err as Error)?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-6)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Create an Account</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Sign up to start practicing.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant="error" title="Registration Failed">
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextInput
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={isLoading}
          />
          <TextInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@examforge.com"
            required
            disabled={isLoading}
          />
          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLoading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Sign Up
          </Button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
            <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

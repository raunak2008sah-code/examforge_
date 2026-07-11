'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordField } from '@/components/ui/forms/TextInput';
import { Button } from '@/components/ui/forms/Button';
import { authClient } from '@/lib/auth-client';
import { Alert } from '@/components/ui/feedback/Alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
        return;
      }

      // Fetch fresh session to get role
      const sessionResponse = await authClient.getSession();
      const role = (sessionResponse?.data?.user as any)?.role;

      if (role === 'ADMIN' || role === 'REVIEWER') {
        router.push('/admin');
      } else {
        router.push('/student');
      }
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
          <h1 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Welcome to ExamForge</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert variant="error" title="Login Failed">
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@examforge.com"
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
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

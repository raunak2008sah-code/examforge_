import { redirect } from 'next/navigation';
import { authService } from '../server/auth/auth-service';

export default async function HomePage() {
  const session = await authService.getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'REVIEWER') {
    redirect('/admin');
  }

  if (session.user.role === 'STUDENT') {
    redirect('/student');
  }

  // Fallback
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1 className="text-display" style={{ color: 'var(--brand-primary)' }}>Welcome to ExamForge</h1>
    </div>
  );
}

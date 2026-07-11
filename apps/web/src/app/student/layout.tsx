import { ReactNode } from 'react';
import { authService } from '../../server/auth/auth-service';
import { redirect } from 'next/navigation';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await authService.getSession();
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          ExamForge 
          <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
            Student
          </span>
        </h1>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span>{session.user.name}</span>
          <form action={async () => {
            'use server';
            const { auth } = await import('@/server/auth/auth');
            const { headers } = await import('next/headers');
            await auth.api.signOut({
              headers: await headers()
            });
            redirect('/login');
          }}>
             <button type="submit" className="text-slate-400 hover:text-slate-600 transition-colors underline">Logout</button>
          </form>
        </div>
      </nav>
      <main className="p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}

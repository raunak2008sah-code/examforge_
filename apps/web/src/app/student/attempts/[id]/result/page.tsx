import { authService } from '../../../../../server/auth/auth-service';
import { prisma } from '@examforge/db';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle, Award, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await authService.requireAuth();
  const { id } = await params;
  
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      responses: true,
      examVersion: {
        include: { exam: true }
      }
    }
  });

  if (!attempt || attempt.userId !== session.user.id) notFound();
  
  const maxScore = (attempt.examVersion.snapshotJson as any)?.sections?.reduce((acc: number, s: any) => {
     return acc + s.questions.reduce((qAcc: number, q: any) => qAcc + (q.marks || 4), 0);
  }, 0) || 100;

  const percentage = attempt.score !== null ? Math.round((attempt.score / maxScore) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
           <Award className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Exam Submitted Successfully!</h1>
        <p className="text-slate-500 mb-8">{attempt.examVersion.exam.title}</p>
        
        <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
           <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 font-medium mb-1">Total Score</div>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                 {attempt.score} <span className="text-xl text-slate-400 font-medium">/ {maxScore}</span>
              </div>
           </div>
           
           <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 font-medium mb-1">Percentage</div>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                 {percentage}%
              </div>
           </div>
        </div>

        <div className="mt-12">
           <Link href="/student" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700">
              Back to Dashboard
           </Link>
        </div>
      </div>
    </div>
  );
}

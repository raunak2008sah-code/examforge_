import { authService } from '../../../../server/auth/auth-service';
import { ExamService } from '../../../../server/services/exam.service';
import { notFound } from 'next/navigation';
import { Clock, ShieldAlert, Award } from 'lucide-react';
import { StartExamButton } from '../../../../components/cbt/StartExamButton';

export default async function ExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await authService.requireAuth();
  const { id } = await params;
  const exam = await ExamService.getExamDetails(id, session.user.id);

  if (!exam) notFound();

  const duration = (exam.currentVersion?.snapshotJson as any)?.durationMinutes || 180;
  const scheme = (exam.currentVersion?.snapshotJson as any)?.markingScheme || { correct: 4, incorrect: -1 };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{exam.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
             <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> {duration} Minutes
             </span>
             <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                <Award className="w-4 h-4" /> +{scheme.correct} / {scheme.incorrect} marks
             </span>
          </div>
        </div>

        <div className="p-10">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500"/>
            Important Instructions
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 mb-10 list-disc list-inside">
            <li>Ensure you have a stable internet connection.</li>
            <li>Do not refresh the page or open other tabs during the exam.</li>
            <li>The exam will auto-submit when the timer reaches zero.</li>
            <li>Progress is saved automatically.</li>
          </ul>

          <div className="flex justify-end">
            <StartExamButton examId={exam.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

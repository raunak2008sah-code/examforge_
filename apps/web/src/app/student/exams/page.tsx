import { authService } from '../../../server/auth/auth-service';
import { ExamService } from '../../../server/services/exam.service';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function StudentExamsPage() {
  const session = await authService.requireAuth();
  const exams = await ExamService.getAvailableExams(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          Available Exams
        </h2>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Choose an exam to practice.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam: any) => {
          const duration = (exam.currentVersion?.snapshotJson as any)?.durationMinutes || 180;
          return (
            <Link key={exam.id} href={`/student/exams/${exam.id}`} className="block group">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-lg transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${exam.isOfficial ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {exam.isOfficial ? 'Official' : 'Personal'}
                  </span>
                  <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    {exam.examType.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {exam.title}
                </h3>
                
                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {duration} mins
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                    View <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-full text-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500">No exams available yet. Try uploading a PDF!</p>
          </div>
        )}
      </div>
    </div>
  );
}

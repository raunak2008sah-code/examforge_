import { ReviewDashboard } from '../../../components/exam-builder/ReviewDashboard';
import { ClipboardCheck } from 'lucide-react';

export default function StudentReviewPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-indigo-500" />
          Review Parsed Exams
        </h2>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Verify the extracted questions and save them to your personal library.
        </p>
      </div>
      <ReviewDashboard basePath="/student/review" />
    </div>
  );
}

import { FileUploader } from '../../../components/upload/FileUploader';
import { UploadCloud } from 'lucide-react';

export default function StudentUploadPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <UploadCloud className="w-8 h-8 text-indigo-500" />
          Convert a PDF
        </h2>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Upload any past paper or practice exam PDF. Our intelligent parser will securely extract the questions and generate a private, interactive Computer-Based Test just for you.
        </p>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        <FileUploader />
      </div>
    </div>
  );
}

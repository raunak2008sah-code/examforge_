import { FileUploader } from '../../../components/upload/FileUploader';
import { PageContainer } from '../../../components/admin/layout/PageContainer';
import { UploadCloud } from 'lucide-react';

export default function AdminUploadPage() {
  return (
    <PageContainer title="Upload Official Exams">
      <div className="max-w-4xl mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
             <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
               <UploadCloud className="w-6 h-6 text-indigo-500" />
               New Official Exam
             </h3>
             <p className="text-sm text-slate-500 mt-1">Upload an official PDF to be parsed and appended to the global test bank.</p>
           </div>
           <FileUploader />
        </div>
      </div>
    </PageContainer>
  );
}

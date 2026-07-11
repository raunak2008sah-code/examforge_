'use client';

import React, { useState } from 'react';
import { UploadDropzone } from './UploadDropzone';
import { ParserJobCard } from './ParserJobCard';
import { Loader2, FileText, CheckCircle } from 'lucide-react';
import type { UploadedFile } from '@examforge/db';

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedRecord, setUploadedRecord] = useState<UploadedFile | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // 1. Upload File
      const uploadRes = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadedData = await uploadRes.json();
      setUploadedRecord(uploadedData);

      // 2. Spawn Parser Job
      const jobRes = await fetch('/api/v1/parser-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: uploadedData.id }),
      });

      if (!jobRes.ok) {
        const errorData = await jobRes.json();
        throw new Error(errorData.error || 'Failed to start parser job');
      }

      const jobData = await jobRes.json();
      setJobId(jobData.id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setUploadedRecord(null);
    setJobId(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {!file && (
        <UploadDropzone onFileSelect={handleUpload} maxSizeMB={10} />
      )}

      {file && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{file.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
              </div>
            </div>
            
            {uploading && (
              <div className="flex items-center gap-2 text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            )}
            {uploadedRecord && !uploading && (
               <div className="flex items-center gap-2 text-emerald-600">
                 <CheckCircle className="w-6 h-6" />
               </div>
            )}
          </div>
          
          {error && (
            <div className="mt-5 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button onClick={reset} className="underline font-semibold hover:text-red-900 transition-colors">Try again</button>
            </div>
          )}

          {jobId && (
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                Processing Pipeline
              </h4>
              <ParserJobCard jobId={jobId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

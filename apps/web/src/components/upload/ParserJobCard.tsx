'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ParserJob } from '@examforge/db';

interface ParserJobCardProps {
  jobId: string;
  onComplete?: (job: ParserJob) => void;
}

export function ParserJobCard({ jobId, onComplete }: ParserJobCardProps) {
  const [job, setJob] = useState<ParserJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/v1/parser-job/${jobId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch job status');
        }
        const data = await res.json();
        setJob(data);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (data.status === 'COMPLETED' && onComplete) {
            onComplete(data);
          }
          return; // Stop polling
        }

        // Poll again after 2 seconds
        timeoutId = setTimeout(fetchStatus, 2000);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [jobId, onComplete]);

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-3">
        <XCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 shrink-0" />
        <p className="text-sm text-slate-600">Initializing parser job...</p>
      </div>
    );
  }

  const getStatusDisplay = () => {
    switch (job.status) {
      case 'QUEUED':
        return { icon: <Clock className="w-5 h-5 text-amber-500 shrink-0" />, text: 'Queued for parsing', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      case 'PROCESSING':
        return { icon: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />, text: 'Extracting questions from PDF...', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' };
      case 'COMPLETED':
        return { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />, text: 'Ready for Review', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
      case 'FAILED':
        return { icon: <XCircle className="w-5 h-5 text-red-500 shrink-0" />, text: 'Parsing failed', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
      default:
        return { icon: <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />, text: 'Unknown status', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between ${display.bg} transition-colors duration-300`}>
      <div className="flex items-center gap-3">
        {display.icon}
        <div>
          <p className={`text-sm font-semibold ${display.color}`}>{display.text}</p>
          <p className="text-xs text-slate-500 mt-0.5 opacity-80">Job ID: {jobId}</p>
        </div>
      </div>
      {job.status === 'COMPLETED' && (
        <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
          100%
        </span>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, FileText, ArrowRight, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/forms/Button';

type ReviewItem = any; // Will refine with Prisma types if needed

export function ReviewDashboard({ basePath = '/student/review' }: { basePath?: string }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/v1/review');
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setReviews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Error loading reviews</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No pending reviews</h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">Upload a PDF to parse an exam and it will appear here for your review.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-indigo-300 transition-colors flex items-center justify-between group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                {review.parserJob.file.originalFilename}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-medium">
                  {review.status}
                </span>
                {review.parserJob.overallConfidence && (
                  <span className="text-emerald-600 font-medium">
                    {(review.parserJob.overallConfidence * 100).toFixed(0)}% Confidence
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="danger" className="hover:bg-red-50 hover:border-red-200 py-1.5 px-3">
               <Trash2 className="w-4 h-4" />
            </Button>
            <Button 
               className="bg-indigo-600 hover:bg-indigo-700 py-1.5 px-3"
               onClick={() => router.push(`${basePath}/${review.id}`)}
            >
               Open Review <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

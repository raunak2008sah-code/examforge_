'use client';

import React from 'react';
import { ExamCard } from './ExamCard';
import { CardSkeleton } from '../ui/skeletons/Skeletons';

export interface ExamListProps {
  exams: any[];
  isLoading?: boolean;
  emptyMessage?: string;
  savedExamIds?: Set<string>;
  onToggleSave?: (examId: string) => Promise<void>;
  hideOwner?: boolean;
}

export function ExamList({ 
  exams, 
  isLoading = false, 
  emptyMessage = "No exams available.", 
  savedExamIds = new Set(),
  onToggleSave,
  hideOwner = false
}: ExamListProps) {
  
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div 
        className="col-span-full text-center p-12 rounded-2xl border-2 border-dashed"
        style={{ 
          backgroundColor: 'var(--bg-sunken)', 
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)'
        }}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exams.map(exam => (
        <ExamCard 
          key={exam.id} 
          exam={exam} 
          isSaved={savedExamIds.has(exam.id)}
          onToggleSave={onToggleSave}
          hideOwner={hideOwner}
        />
      ))}
    </div>
  );
}

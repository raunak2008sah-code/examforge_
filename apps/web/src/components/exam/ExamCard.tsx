'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';

export interface ExamCardProps {
  exam: any; // Using any for nested relations (currentVersion, owner)
  isSaved?: boolean;
  onToggleSave?: (examId: string) => Promise<void>;
  hideOwner?: boolean;
}

export function ExamCard({ exam, isSaved = false, onToggleSave, hideOwner = false }: ExamCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

  const duration = exam.currentVersion?.snapshotJson?.durationMinutes || 180;
  
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onToggleSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onToggleSave(exam.id);
      setLocalSaved(!localSaved);
    } catch (err) {
      console.error('Failed to toggle save state', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Link href={`/student/exams/${exam.id}`} className="block group">
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          borderColor: 'var(--border-subtle)', 
          borderRadius: 'var(--radius-lg)' 
        }} 
        className="border p-6 hover:shadow-lg transition-all h-full flex flex-col relative"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2">
            <span 
              className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: exam.isOfficial ? 'var(--brand-primary)' : 'var(--bg-sunken)',
                color: exam.isOfficial ? 'var(--bg-surface)' : 'var(--text-secondary)'
              }}
            >
              {exam.isOfficial ? 'Official' : 'Personal'}
            </span>
            <span 
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                color: 'var(--text-secondary)'
              }}
            >
              {exam.examType.replace('_', ' ')}
            </span>
          </div>

          {onToggleSave && (
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="p-1 rounded-md transition-colors"
              style={{ color: localSaved ? 'var(--brand-primary)' : 'var(--text-secondary)' }}
              aria-label={localSaved ? "Unsave exam" : "Save exam"}
            >
              {localSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        <h3 className="text-xl font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {exam.title}
        </h3>

        {!hideOwner && exam.owner && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            By {exam.owner.name}
          </p>
        )}
        
        <div className="mt-auto pt-4 flex items-center justify-between text-sm border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Clock className="w-4 h-4" />
            {duration} mins
          </div>
          <div className="flex items-center gap-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0" style={{ color: 'var(--brand-primary)' }}>
            View <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

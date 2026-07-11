'use client';

import React, { useState, useEffect } from 'react';
import { Library } from 'lucide-react';
import { Tabs, Tab } from '@/components/ui/navigation/Tabs';
import { ExamList } from '@/components/exam/ExamList';
import { ExamFilterBar } from '@/components/exam/ExamFilterBar';

export function LibraryClient() {
  const [myExams, setMyExams] = useState<any[]>([]);
  const [savedExams, setSavedExams] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  const [mySearch, setMySearch] = useState('');
  const [savedSearch, setSavedSearch] = useState('');
  
  const [isLoadingMy, setIsLoadingMy] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Fetch My Exams
  useEffect(() => {
    const fetchMyExams = async () => {
      setIsLoadingMy(true);
      try {
        const url = new URL('/api/v1/exams/me', window.location.origin);
        if (mySearch) url.searchParams.set('search', mySearch);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setMyExams(data.exams || []);
        }
      } catch (err) {
        console.error('Error fetching my exams', err);
      } finally {
        setIsLoadingMy(false);
      }
    };
    
    const timer = setTimeout(fetchMyExams, 300);
    return () => clearTimeout(timer);
  }, [mySearch]);

  // Fetch Saved Exams
  useEffect(() => {
    const fetchSavedExams = async () => {
      setIsLoadingSaved(true);
      try {
        const url = new URL('/api/v1/exams/saved', window.location.origin);
        if (savedSearch) url.searchParams.set('search', savedSearch);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const exams = data.exams || [];
          setSavedExams(exams);
          setSavedIds(new Set(exams.map((e: any) => e.id)));
        }
      } catch (err) {
        console.error('Error fetching saved exams', err);
      } finally {
        setIsLoadingSaved(false);
      }
    };
    
    const timer = setTimeout(fetchSavedExams, 300);
    return () => clearTimeout(timer);
  }, [savedSearch]);

  const handleToggleSave = async (examId: string) => {
    try {
      const res = await fetch(`/api/v1/exams/${examId}/save`, { method: 'POST' });
      if (res.ok) {
        const { saved } = await res.json();
        
        setSavedIds(prev => {
          const next = new Set(prev);
          if (saved) next.add(examId);
          else next.delete(examId);
          return next;
        });

        // If unsaved, optimistically remove it from the savedExams list
        if (!saved) {
          setSavedExams(prev => prev.filter(e => e.id !== examId));
        }
      }
    } catch (err) {
      console.error('Failed to save exam', err);
    }
  };

  const tabs: Tab[] = [
    {
      id: 'my-exams',
      label: 'My Uploads',
      content: (
        <div className="pt-4">
          <ExamFilterBar 
            searchQuery={mySearch} 
            onSearchChange={setMySearch} 
            placeholder="Search your uploads..." 
          />
          <ExamList 
            exams={myExams} 
            isLoading={isLoadingMy} 
            hideOwner={true}
            emptyMessage={mySearch ? "No uploads match your search." : "You haven't uploaded any exams yet."}
          />
        </div>
      )
    },
    {
      id: 'saved-exams',
      label: 'Saved Exams',
      content: (
        <div className="pt-4">
          <ExamFilterBar 
            searchQuery={savedSearch} 
            onSearchChange={setSavedSearch} 
            placeholder="Search saved exams..." 
          />
          <ExamList 
            exams={savedExams} 
            isLoading={isLoadingSaved} 
            savedExamIds={savedIds}
            onToggleSave={handleToggleSave}
            emptyMessage={savedSearch ? "No saved exams match your search." : "You haven't saved any exams yet."}
          />
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Library className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
          Student Library
        </h2>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Manage your uploaded and saved exams.
        </p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <Tabs tabs={tabs} defaultTabId="my-exams" />
      </div>
    </div>
  );
}

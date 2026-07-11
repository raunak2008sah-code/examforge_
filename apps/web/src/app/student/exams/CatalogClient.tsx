'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { ExamFilterBar } from '@/components/exam/ExamFilterBar';
import { ExamList } from '@/components/exam/ExamList';

export function CatalogClient() {
  const [exams, setExams] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const url = new URL('/api/v1/exams/official', window.location.origin);
        if (search) url.searchParams.set('search', search);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setExams(data.exams || []);
        }
        
        // Also fetch saved status
        const savedRes = await fetch('/api/v1/exams/saved');
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const ids = new Set<string>((savedData.exams || []).map((e: any) => e.id));
          setSavedIds(ids);
        }
      } catch (err) {
        console.error('Error fetching catalog', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce
    const timer = setTimeout(() => {
      fetchExams();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);

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
      }
    } catch (err) {
      console.error('Failed to save exam', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <BookOpen className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
          Official Exam Catalog
        </h2>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Browse and practice with officially published exams.
        </p>
      </div>

      <ExamFilterBar 
        searchQuery={search} 
        onSearchChange={setSearch} 
        placeholder="Search official exams..." 
      />

      <ExamList 
        exams={exams} 
        isLoading={isLoading} 
        savedExamIds={savedIds}
        onToggleSave={handleToggleSave}
        emptyMessage={search ? "No official exams match your search." : "No official exams available yet."}
      />
    </div>
  );
}

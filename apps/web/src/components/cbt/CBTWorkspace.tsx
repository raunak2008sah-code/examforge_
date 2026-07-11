'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Clock, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { Button } from '../ui/forms/Button';
import { useRouter } from 'next/navigation';

export function CBTWorkspace({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, { selectedOptionId: string | null, markedForReview: boolean }>>({});

  useEffect(() => {
    fetch(`/api/v1/attempts/${attemptId}`)
      .then(r => r.json())
      .then(data => {
         if (data.error) throw new Error(data.error);
         if (data.status !== 'IN_PROGRESS') {
            router.push(`/student/attempts/${attemptId}/result`);
            return;
         }
         
         setAttempt(data);
         const remaining = Math.max(0, new Date(data.expiresAt).getTime() - Date.now());
         setTimeRemaining(Math.floor(remaining / 1000));
         
         const initialResponses: any = {};
         for (const r of data.responses || []) {
            initialResponses[r.questionId] = {
               selectedOptionId: r.selectedOptionId,
               markedForReview: r.markedForReview
            };
         }
         setResponses(initialResponses);
         setLoading(false);
      })
      .catch(e => {
         setError(e.message);
         setLoading(false);
      });
  }, [attemptId, router]);

  useEffect(() => {
    if (!attempt) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
           clearInterval(interval);
           handleSubmit(true);
           return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  const saveResponse = useCallback(async (qId: string, optId: string | null, marked: boolean) => {
    setSaving(true);
    setResponses(prev => ({...prev, [qId]: { selectedOptionId: optId, markedForReview: marked }}));
    try {
      await fetch(`/api/v1/attempts/${attemptId}/responses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, selectedOptionId: optId, markedForReview: marked })
      });
    } catch (e) {
      console.error('Failed to save', e);
    } finally {
      setSaving(false);
    }
  }, [attemptId]);

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !confirm('Are you sure you want to submit the exam?')) return;
    try {
      await fetch(`/api/v1/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoSubmit })
      });
      router.push(`/student/attempts/${attemptId}/result`);
    } catch (e) {
      console.error(e);
      alert('Failed to submit. Please check connection.');
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-500"/></div>;
  if (error) return <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-red-600 font-bold">{error}</div>;
  if (!attempt) return null;

  const sections = attempt.examVersion.sections;
  const activeSection = sections[activeSectionIdx];
  const activeQuestion = activeSection.questions[activeQuestionIdx];
  const activeResponse = responses[activeQuestion.id] || { selectedOptionId: null, markedForReview: false };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClear = () => saveResponse(activeQuestion.id, null, activeResponse.markedForReview);
  const handleMarkReview = () => saveResponse(activeQuestion.id, activeResponse.selectedOptionId, !activeResponse.markedForReview);
  const handleOptionSelect = (optId: string) => saveResponse(activeQuestion.id, optId, activeResponse.markedForReview);

  const goNext = () => {
     if (activeQuestionIdx < activeSection.questions.length - 1) {
        setActiveQuestionIdx((prev: number) => prev + 1);
     } else if (activeSectionIdx < sections.length - 1) {
        setActiveSectionIdx((prev: number) => prev + 1);
        setActiveQuestionIdx(0);
     }
  };

  const goPrev = () => {
     if (activeQuestionIdx > 0) {
        setActiveQuestionIdx((prev: number) => prev - 1);
     } else if (activeSectionIdx > 0) {
        setActiveSectionIdx((prev: number) => prev - 1);
        setActiveQuestionIdx(sections[activeSectionIdx - 1].questions.length - 1);
     }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-screen bg-slate-100 dark:bg-slate-950 font-sans">
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md z-10 shrink-0">
        <div>
           <h1 className="text-xl font-bold">{attempt.examVersion.exam.title}</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${timeRemaining < 300 ? 'bg-red-500 animate-pulse' : 'bg-indigo-800'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
           </div>
           {saving && <Loader2 className="w-5 h-5 animate-spin opacity-50" />}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
           <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
             {sections.map((s: any, idx: number) => (
                <button 
                  key={s.id} 
                  onClick={() => { setActiveSectionIdx(idx); setActiveQuestionIdx(0); }}
                  className={`px-6 py-3 font-semibold whitespace-nowrap ${idx === activeSectionIdx ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  {s.name}
                </button>
             ))}
           </div>
           
           <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Question {activeQuestion.displayNumber}</h2>
                    <div className="flex gap-4">
                       <span className="text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">Marks: {activeQuestion.marks || 4}</span>
                    </div>
                 </div>
                 
                 <div className="text-lg text-slate-800 dark:text-slate-200 mb-8 leading-relaxed whitespace-pre-wrap">
                    {activeQuestion.statement}
                 </div>
                 
                 <div className="space-y-3">
                    {activeQuestion.options.map((opt: any) => {
                       const isSelected = activeResponse.selectedOptionId === opt.id;
                       return (
                         <div 
                           key={opt.id}
                           onClick={() => handleOptionSelect(opt.id)}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                             ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}
                           `}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                               ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                            `}>
                               {opt.label}
                            </div>
                            <span className={`text-lg ${isSelected ? 'text-indigo-900 dark:text-indigo-100 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                               {opt.text}
                            </span>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>

           <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex gap-2">
                 <button onClick={handleMarkReview} className={`px-4 py-2 rounded-md font-medium text-sm flex items-center ${activeResponse.markedForReview ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    <Bookmark className="w-4 h-4 mr-2"/> {activeResponse.markedForReview ? 'Unmark Review' : 'Mark for Review'}
                 </button>
                 <button onClick={handleClear} disabled={!activeResponse.selectedOptionId} className="px-4 py-2 rounded-md font-medium text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50">
                    Clear Response
                 </button>
              </div>
              <div className="flex gap-2">
                 <button onClick={goPrev} disabled={activeSectionIdx === 0 && activeQuestionIdx === 0} className="px-4 py-2 rounded-md font-medium text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1"/> Previous
                 </button>
                 <button onClick={goNext} className="px-4 py-2 rounded-md font-medium text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center">
                    Save & Next <ChevronRight className="w-4 h-4 ml-1"/>
                 </button>
              </div>
           </div>
        </main>

        <aside className="w-80 bg-slate-50 dark:bg-slate-900 flex flex-col shrink-0">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Question Palette</h3>
           </div>
           <div className="p-4 grid grid-cols-5 gap-2 overflow-y-auto flex-1 content-start">
              {activeSection.questions.map((q: any, idx: number) => {
                 const res = responses[q.id];
                 const isAnswered = !!res?.selectedOptionId;
                 const isMarked = res?.markedForReview;
                 
                 let colorClass = 'bg-white text-slate-700 border border-slate-300'; 
                 if (isAnswered && !isMarked) colorClass = 'bg-emerald-500 text-white border-emerald-500';
                 else if (!isAnswered && isMarked) colorClass = 'bg-purple-500 text-white rounded-full border-purple-500';
                 else if (isAnswered && isMarked) colorClass = 'bg-purple-500 text-white rounded-full border-2 border-emerald-400';
                 else if (idx === activeQuestionIdx) colorClass = 'bg-red-500 text-white border-red-500';

                 return (
                    <button 
                       key={q.id}
                       onClick={() => setActiveQuestionIdx(idx)}
                       className={`w-10 h-10 flex items-center justify-center font-bold text-sm rounded ${colorClass} ${idx === activeQuestionIdx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    >
                       {q.displayNumber}
                    </button>
                 );
              })}
           </div>
           <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
              <button onClick={() => handleSubmit(false)} className="w-full bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 py-3 text-lg">
                 Submit Exam
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}

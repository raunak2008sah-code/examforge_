'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Send, AlertCircle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/forms/Button';

interface ExamBuilderProps {
  reviewId: string;
  isOfficialMode?: boolean;
}

export function ExamBuilder({ reviewId, isOfficialMode = false }: ExamBuilderProps) {
  const [workingJson, setWorkingJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/v1/review/${reviewId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load draft');
        return r.json();
      })
      .then(data => {
        setWorkingJson(data.workingJson);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [reviewId]);

  const saveDraft = useCallback(async (json: any) => {
    setSaving(true);
    try {
      await fetch(`/api/v1/review/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingJson: json }),
      });
    } catch (e) {
      console.error('Autosave failed', e);
    } finally {
      setSaving(false);
    }
  }, [reviewId]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (!workingJson) return;
    const timeout = setTimeout(() => {
      saveDraft(workingJson);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [workingJson, saveDraft]);

  const handleCommit = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/v1/review/${reviewId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOfficial: isOfficialMode }),
      });
      if (!res.ok) throw new Error('Commit failed');
      
      router.push(isOfficialMode ? '/admin' : '/student');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTitle = (val: string) => setWorkingJson({ ...workingJson, title: val });

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;
  if (error) return <div className="p-6 bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText className="w-5 h-5"/></div>
          <input 
            value={workingJson?.title || ''}
            onChange={e => updateTitle(e.target.value)}
            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : <><Save className="w-4 h-4"/> Saved</>}
          </div>
          <Button onClick={handleCommit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
             {isOfficialMode ? 'Publish Official Exam' : 'Save to Library'} <Send className="w-4 h-4 ml-2"/>
          </Button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Exam Properties</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Exam Type</label>
                 <select 
                   value={workingJson?.examType || 'JEE_MAIN'}
                   onChange={e => setWorkingJson({...workingJson, examType: e.target.value})}
                   className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                 >
                   <option value="JEE_MAIN">JEE Main</option>
                 </select>
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration (Minutes)</label>
                 <input 
                   type="number"
                   value={workingJson?.durationMinutes || 180}
                   onChange={e => setWorkingJson({...workingJson, durationMinutes: parseInt(e.target.value, 10)})}
                   className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                 />
               </div>
            </div>
          </div>
          
          {workingJson?.sections?.map((section: any, sIdx: number) => (
             <div key={section.id || sIdx} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{section.name}</h3>
                
                <div className="space-y-4">
                  {section.questions?.map((q: any, qIdx: number) => (
                     <div key={q.id || qIdx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex gap-4">
                           <span className="font-bold text-slate-400">{q.displayNumber}.</span>
                           <div className="flex-1">
                              <textarea 
                                value={q.statement}
                                onChange={e => {
                                  const newJson = {...workingJson};
                                  newJson.sections[sIdx].questions[qIdx].statement = e.target.value;
                                  setWorkingJson(newJson);
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 min-h-[60px]"
                              />
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                 {q.options?.map((opt: any, oIdx: number) => (
                                    <div key={opt.id || oIdx} className={`p-2 rounded border ${opt.isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                       <span className="font-semibold mr-2">{opt.label}:</span>
                                       <input 
                                         value={opt.text}
                                         onChange={e => {
                                            const newJson = {...workingJson};
                                            newJson.sections[sIdx].questions[qIdx].options[oIdx].text = e.target.value;
                                            setWorkingJson(newJson);
                                         }}
                                         className="bg-transparent border-none focus:ring-0 p-0 text-sm w-[80%] text-slate-900 dark:text-slate-100"
                                       />
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

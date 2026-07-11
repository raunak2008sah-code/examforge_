'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, Send, AlertCircle, FileText, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/forms/Button';
import { QuestionEditor } from './QuestionEditor';
import { ParsedQuestion, ExamDocumentSchema } from '@examforge/shared-types';
import { Alert } from '../ui/feedback/Alert';

interface ExamBuilderProps {
  reviewId: string;
  isOfficialMode?: boolean;
}

export function ExamBuilder({ reviewId, isOfficialMode = false }: ExamBuilderProps) {
  const [workingJson, setWorkingJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

  const validate = () => {
    const errors: string[] = [];
    if (!workingJson.metadata?.examName) errors.push('Exam Title is required.');
    
    workingJson.sections?.forEach((section: any, sIdx: number) => {
      if (!section.questions || section.questions.length === 0) {
        errors.push(`Section ${section.name || sIdx + 1} has no questions.`);
      }
      section.questions?.forEach((q: ParsedQuestion, qIdx: number) => {
        if (!q.statement || q.statement.trim() === '') {
          errors.push(`Question Q${q.displayNumber || qIdx + 1} is empty.`);
        }
        if (!q.options || q.options.length < 2) {
          errors.push(`Question Q${q.displayNumber || qIdx + 1} must have at least 2 options.`);
        }
        if (!q.correctOption && !q.options.some(o => o.isCorrect)) {
          errors.push(`Question Q${q.displayNumber || qIdx + 1} does not have a correct answer marked.`);
        }
      });
    });
    return errors;
  };

  const handleCommit = async () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    try {
      setSaving(true);
      setValidationErrors([]);
      const res = await fetch(`/api/v1/review/${reviewId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOfficial: isOfficialMode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Commit failed');
      }
      
      router.push(isOfficialMode ? '/admin' : '/student');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateMetadata = (key: string, val: any) => {
    setWorkingJson({
      ...workingJson,
      metadata: { ...workingJson.metadata, [key]: val }
    });
  };

  const updateQuestion = (sIdx: number, qIdx: number, q: ParsedQuestion) => {
    const newJson = { ...workingJson };
    newJson.sections[sIdx].questions[qIdx] = q;
    setWorkingJson(newJson);
  };

  const deleteQuestion = (sIdx: number, qIdx: number) => {
    const newJson = { ...workingJson };
    newJson.sections[sIdx].questions.splice(qIdx, 1);
    setWorkingJson(newJson);
  };

  const duplicateQuestion = (sIdx: number, qIdx: number) => {
    const newJson = { ...workingJson };
    const qToDuplicate = newJson.sections[sIdx].questions[qIdx];
    const duplicated = {
      ...qToDuplicate,
      id: crypto.randomUUID(),
      displayNumber: `${qToDuplicate.displayNumber}-copy`,
      reviewStatus: 'pending'
    };
    newJson.sections[sIdx].questions.splice(qIdx + 1, 0, duplicated);
    setWorkingJson(newJson);
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500"/></div>;
  if (error) return <div className="p-6 bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><FileText className="w-5 h-5"/></div>
          <input 
            value={workingJson?.metadata?.examName || workingJson?.title || ''}
            onChange={e => updateMetadata('examName', e.target.value)}
            placeholder="Exam Title"
            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white w-64"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : <><Save className="w-4 h-4"/> Autosaved</>}
          </div>
          <Button onClick={handleCommit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
             {isOfficialMode ? 'Publish Official Exam' : 'Save to Library'} <Send className="w-4 h-4 ml-2"/>
          </Button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100/50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          
          {validationErrors.length > 0 && (
            <div className="mb-8">
              <Alert variant="error" title="Validation Errors">
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </Alert>
            </div>
          )}

          {workingJson?.sections?.map((section: any, sIdx: number) => (
             <div key={section.id || sIdx} className="mb-12">
                <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{section.name || `Section ${sIdx + 1}`}</h3>
                  <span className="text-sm text-slate-500 font-medium">{section.questions?.length || 0} Questions</span>
                </div>
                
                <div className="space-y-6">
                  {section.questions?.map((q: any, qIdx: number) => (
                    <QuestionEditor
                      key={q.id || qIdx}
                      question={q}
                      index={qIdx}
                      onUpdate={(updatedQ) => updateQuestion(sIdx, qIdx, updatedQ)}
                      onDelete={() => deleteQuestion(sIdx, qIdx)}
                      onDuplicate={() => duplicateQuestion(sIdx, qIdx)}
                    />
                  ))}
                  
                  {(!section.questions || section.questions.length === 0) && (
                     <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                       No questions in this section.
                     </div>
                  )}
                  
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={() => {
                        const newJson = { ...workingJson };
                        const newQ = {
                          id: crypto.randomUUID(),
                          displayNumber: `${newJson.sections[sIdx].questions.length + 1}`,
                          statement: '',
                          options: [
                            { id: crypto.randomUUID(), label: 'A', text: '', isCorrect: false },
                            { id: crypto.randomUUID(), label: 'B', text: '', isCorrect: false }
                          ],
                          correctOption: null,
                          confidence: 100,
                          flags: [],
                          reviewStatus: 'pending'
                        };
                        newJson.sections[sIdx].questions.push(newQ);
                        setWorkingJson(newJson);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      <PlusCircle className="w-5 h-5" /> Add Question manually
                    </button>
                  </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

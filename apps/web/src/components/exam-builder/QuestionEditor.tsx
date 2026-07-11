import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Trash2, Copy, GripVertical, CheckCircle, Circle, Plus, Minus } from 'lucide-react';
import { ParsedQuestion, ParsedOption } from '@examforge/shared-types';

interface QuestionEditorProps {
  question: ParsedQuestion;
  index: number;
  onUpdate: (q: ParsedQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function QuestionEditor({ question, index, onUpdate, onDelete, onDuplicate }: QuestionEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const updateStatement = (val: string) => onUpdate({ ...question, statement: val });
  const updateOptionText = (oId: string, val: string) => {
    onUpdate({
      ...question,
      options: question.options.map(o => o.id === oId ? { ...o, text: val } : o)
    });
  };
  const setCorrectOption = (oId: string) => {
    onUpdate({
      ...question,
      options: question.options.map(o => ({ ...o, isCorrect: o.id === oId })),
      correctOption: oId,
      reviewStatus: 'edited',
    });
  };

  const removeOption = (oId: string) => {
    onUpdate({
      ...question,
      options: question.options.filter(o => o.id !== oId)
    });
  };

  const addOption = () => {
    if (question.options.length >= 6) return;
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
    const newLabel = labels[question.options.length];
    
    onUpdate({
      ...question,
      options: [
        ...question.options,
        {
          id: crypto.randomUUID(),
          label: newLabel,
          text: `Option ${newLabel}`,
          isCorrect: false
        }
      ]
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 group">
      
      {/* Question Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button className="cursor-grab text-slate-400 hover:text-slate-600 transition-colors">
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Q{question.displayNumber || index + 1}
          </span>
          {question.flags && question.flags.length > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
              Flagged
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/50 dark:bg-slate-900 rounded-lg p-1 mr-4">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!isPreview ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${isPreview ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Preview
            </button>
          </div>
          
          <button onClick={onDuplicate} title="Duplicate Question" className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Delete Question" className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-5">
        
        {/* Statement */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Problem Statement (Markdown + LaTeX)</label>
          
          {isPreview ? (
            <div className="prose dark:prose-invert max-w-none p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 min-h-[120px]">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {question.statement || '*Empty question statement*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={question.statement}
              onChange={(e) => updateStatement(e.target.value)}
              placeholder="Enter question text here... (Use $$ for math)"
              className="w-full min-h-[120px] p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
            />
          )}
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Options</label>
            <button 
              onClick={addOption}
              disabled={question.options.length >= 6}
              className="text-xs font-medium text-indigo-600 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> Add Option
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt) => (
              <div 
                key={opt.id} 
                className={`relative flex flex-col gap-2 p-3 rounded-lg border-2 transition-all ${
                  opt.isCorrect || question.correctOption === opt.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setCorrectOption(opt.id)}
                    className={`flex items-center gap-2 text-sm font-semibold px-2 py-1 rounded transition-colors ${
                      opt.isCorrect || question.correctOption === opt.id
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {(opt.isCorrect || question.correctOption === opt.id) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    Option {opt.label}
                  </button>
                  
                  <button 
                    onClick={() => removeOption(opt.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
                
                {isPreview ? (
                   <div className="prose dark:prose-invert prose-sm px-2 overflow-x-auto">
                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                       {opt.text || '*Empty option*'}
                     </ReactMarkdown>
                   </div>
                ) : (
                  <textarea 
                    value={opt.text}
                    onChange={(e) => updateOptionText(opt.id, e.target.value)}
                    placeholder="Option text..."
                    className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm text-slate-900 dark:text-slate-100 resize-y min-h-[60px]"
                  />
                )}
              </div>
            ))}
          </div>
          
          {question.options.length === 0 && (
             <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
               No options defined. Add options to make it a multiple choice question.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

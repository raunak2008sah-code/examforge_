'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { TextInput } from '../ui/forms/TextInput';

export interface ExamFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
}

export function ExamFilterBar({ searchQuery, onSearchChange, placeholder = "Search exams..." }: ExamFilterBarProps) {
  return (
    <div 
      className="flex items-center gap-4 mb-6 p-4 rounded-xl border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div className="relative flex-1 max-w-md">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
          style={{ color: 'var(--text-secondary)' }} 
        />
        <TextInput
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: 'var(--space-7)' }}
          aria-label="Search exams"
        />
      </div>
    </div>
  );
}

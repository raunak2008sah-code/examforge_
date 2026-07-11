'use client';

import React, { useState } from 'react';
import { Button } from '../ui/forms/Button';
import { Play, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function StartExamButton({ examId }: { examId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/exams/${examId}/attempt`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to start attempt');
      const data = await res.json();
      
      router.push(`/student/attempts/${data.id}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleStart} 
      disabled={loading} 
      className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto"
    >
      {loading ? (
        <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Preparing Exam...</>
      ) : (
        <>Start Exam Now <Play className="w-6 h-6 ml-2" /></>
      )}
    </Button>
  );
}

import React from 'react';
import { PageContainer } from '@/components/admin/layout/PageContainer';
import { SectionCard } from '@/components/admin/containers/SectionCard';
import { FileText, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  return (
    <PageContainer title="My Workspace">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        <SectionCard 
          title="Exams" 
          description="Browse available exams or take an official test."
        >
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Link 
              href="/student/exams"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
            >
              <FileText size={24} style={{ color: 'var(--primary-main)' }} />
              <div>
                <div style={{ fontSize: '1.1rem' }}>Browse Exams</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Find official and personal exams</div>
              </div>
            </Link>
          </div>
        </SectionCard>

        <SectionCard 
          title="Uploads" 
          description="Convert your own PDFs into interactive tests."
        >
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Link 
              href="/student/upload"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
            >
              <BookOpen size={24} style={{ color: 'var(--primary-main)' }} />
              <div>
                <div style={{ fontSize: '1.1rem' }}>Upload Document</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Create a new personal exam</div>
              </div>
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

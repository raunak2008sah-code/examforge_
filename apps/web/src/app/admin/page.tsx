import React from 'react';
import { PageContainer } from '@/components/admin/layout/PageContainer';
import { StatCard } from '@/components/admin/containers/StatCard';
import { SectionCard } from '@/components/admin/containers/SectionCard';
import { Users, FileText, CheckCircle } from 'lucide-react';
import { prisma } from '@examforge/db';

export default async function AdminDashboardPage() {
  const [totalUsers, activeExams, completedAssessments] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.exam.count({ where: { isOfficial: true, visibility: 'PUBLIC' } }),
    prisma.attempt.count({ where: { status: 'SUBMITTED' } })
  ]);

  return (
    <PageContainer title="Dashboard">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Active Official Exams"
          value={activeExams.toLocaleString()}
          icon={<FileText size={20} />}
        />
        <StatCard
          title="Completed Assessments"
          value={completedAssessments.toLocaleString()}
          icon={<CheckCircle size={20} />}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--space-6)',
        }}
      >
        <SectionCard title="Recent Activity" description="Latest actions across the platform">
          <div style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
            No recent activity to display.
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}

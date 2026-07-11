import { ReviewDashboard } from '../../../components/exam-builder/ReviewDashboard';
import { PageContainer } from '../../../components/admin/layout/PageContainer';

export default function AdminReviewPage() {
  return (
    <PageContainer title="Review Official Parsed Exams">
      <div className="max-w-4xl mt-6">
        <ReviewDashboard basePath="/admin/review" />
      </div>
    </PageContainer>
  );
}

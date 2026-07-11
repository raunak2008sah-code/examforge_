import { ExamBuilder } from '../../../../components/exam-builder/ExamBuilder';
import { PageContainer } from '../../../../components/admin/layout/PageContainer';

export default async function AdminReviewEditorPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return (
    <PageContainer title="Official Exam Builder">
      <div className="h-[80vh] mt-4">
        <ExamBuilder reviewId={id} isOfficialMode={true} />
      </div>
    </PageContainer>
  );
}

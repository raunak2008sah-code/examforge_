import { ExamBuilder } from '../../../../components/exam-builder/ExamBuilder';

export default async function StudentReviewEditorPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return (
    <div className="h-[80vh]">
      <ExamBuilder reviewId={id} isOfficialMode={false} />
    </div>
  );
}

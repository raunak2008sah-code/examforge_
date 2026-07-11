import { CBTWorkspace } from '../../../../components/cbt/CBTWorkspace';

export default async function CBTPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CBTWorkspace attemptId={id} />;
}

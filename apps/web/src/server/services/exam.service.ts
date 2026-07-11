import { prisma } from '@examforge/db';

export class ExamService {
  static async getAvailableExams(userId: string) {
    return prisma.exam.findMany({
      where: {
        OR: [
          { visibility: 'PUBLIC', isOfficial: true },
          { ownerId: userId }
        ],
        currentVersionId: { not: null }
      },
      include: {
        currentVersion: true,
        owner: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getExamDetails(examId: string, userId: string) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        currentVersion: true,
        owner: { select: { name: true } }
      }
    });

    if (!exam) return null;
    if (exam.visibility !== 'PUBLIC' && exam.ownerId !== userId) return null;
    return exam;
  }
}

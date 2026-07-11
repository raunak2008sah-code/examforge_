import { prisma, ExamRepository } from '@examforge/db';

const PAGE_SIZE = 12;

export class ExamService {
  static async getAvailableExams(userId: string) {
    // Keep this for backward compatibility during transition
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

  static async getOfficialExams(search?: string, page: number = 1) {
    const skip = (Math.max(1, page) - 1) * PAGE_SIZE;
    return ExamRepository.findOfficialExams({ search, skip, limit: PAGE_SIZE });
  }

  static async getMyExams(userId: string, search?: string, page: number = 1) {
    const skip = (Math.max(1, page) - 1) * PAGE_SIZE;
    return ExamRepository.findMyExams(userId, { search, skip, limit: PAGE_SIZE });
  }

  static async getSavedExams(userId: string, search?: string, page: number = 1) {
    const skip = (Math.max(1, page) - 1) * PAGE_SIZE;
    return ExamRepository.findSavedExams(userId, { search, skip, limit: PAGE_SIZE });
  }

  static async toggleSave(userId: string, examId: string) {
    return ExamRepository.toggleSavedExam(userId, examId);
  }

  static async isExamSaved(userId: string, examId: string) {
    return ExamRepository.isExamSaved(userId, examId);
  }
}

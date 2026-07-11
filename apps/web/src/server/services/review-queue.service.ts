import { prisma, ExamRepository } from '@examforge/db';
import { NotFoundError, ForbiddenError } from '../errors/domain-errors';

export class ReviewQueueService {
  static async getPendingReviews(userId: string, role: string) {
    const whereClause: any = {
      status: 'PENDING',
      deletedAt: null,
    };

    if (role !== 'ADMIN' && role !== 'REVIEWER') {
       whereClause.parserJob = {
         file: { uploadedBy: userId }
       };
    }

    return prisma.reviewQueue.findMany({
      where: whereClause,
      include: {
        parserJob: {
          include: {
            file: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getReview(id: string, userId: string, role: string) {
    const review = await prisma.reviewQueue.findUnique({
      where: { id },
      include: {
        parserJob: {
          include: { file: true }
        }
      }
    });

    if (!review) throw new NotFoundError('Review not found');

    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      if (review.parserJob.file.uploadedBy !== userId) {
        throw new ForbiddenError('Access denied to this review');
      }
    }

    return review;
  }

  static async saveDraft(id: string, userId: string, role: string, workingJson: any) {
    const review = await this.getReview(id, userId, role);
    return prisma.reviewQueue.update({
      where: { id: review.id },
      data: { workingJson }
    });
  }

  static async commitToExam(id: string, userId: string, role: string, isOfficial: boolean) {
    const review = await this.getReview(id, userId, role);
    
    const visibility = isOfficial && role === 'ADMIN' ? 'PUBLIC' : 'PRIVATE';
    
    return ExamRepository.commitFromReviewQueue(
      review.id,
      userId,
      isOfficial && role === 'ADMIN',
      visibility,
      review.workingJson
    );
  }
}

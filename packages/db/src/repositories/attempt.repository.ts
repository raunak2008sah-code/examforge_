import { prisma } from '../index';
import type { Attempt } from '@prisma/client';

export class AttemptRepository {
  static async createAttempt(userId: string, examVersionId: string, durationMinutes: number): Promise<Attempt> {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60000);

    return prisma.attempt.create({
      data: {
        userId,
        examVersionId,
        status: 'IN_PROGRESS',
        startedAt,
        expiresAt,
      }
    });
  }

  static async getAttemptWithResponses(attemptId: string) {
    return prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: true,
        examVersion: {
          include: {
            sections: {
              include: {
                questions: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  static async upsertResponse(attemptId: string, questionId: string, selectedOptionId: string | null, markedForReview: boolean) {
    return prisma.attemptResponse.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        }
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId,
        markedForReview,
        answeredAt: new Date(),
      },
      update: {
        selectedOptionId,
        markedForReview,
        answeredAt: new Date(),
      }
    });
  }

  static async submitAttempt(attemptId: string, score: number, isAutoSubmit: boolean) {
    return prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        submittedAt: new Date(),
        score,
      }
    });
  }
}

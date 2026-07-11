import { prisma, AttemptRepository } from '@examforge/db';
import { NotFoundError, ForbiddenError, DomainError } from '../errors/domain-errors';
import { EvaluationService } from './evaluation.service';
import { LoggerService } from './logger.service';

export class AttemptService {
  static async startAttempt(examId: string, userId: string) {
    LoggerService.info('Starting attempt', { examId, userId });
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { currentVersion: true }
    });
    
    if (!exam || !exam.currentVersionId || !exam.currentVersion) {
      LoggerService.warn('Exam not found or no published version', { examId, userId });
      throw new NotFoundError('Exam not found or has no published version');
    }

    const existing = await prisma.attempt.findFirst({
      where: { userId, examVersionId: exam.currentVersionId, status: 'IN_PROGRESS' }
    });

    if (existing) {
      if (existing.expiresAt < new Date()) {
         LoggerService.info('Auto-submitting expired existing attempt', { attemptId: existing.id, userId });
         await this.submitAttempt(existing.id, userId, true);
      } else {
         LoggerService.info('Resuming existing attempt', { attemptId: existing.id, userId });
         return existing;
      }
    }

    const duration = (exam.currentVersion.snapshotJson as any)?.durationMinutes || 180;
    return AttemptRepository.createAttempt(userId, exam.currentVersionId, duration);
  }

  static async getAttempt(attemptId: string, userId: string) {
    const attempt = await AttemptRepository.getAttemptWithResponses(attemptId);
    if (!attempt) throw new NotFoundError('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenError('Access denied');

    const safeExamVersion = JSON.parse(JSON.stringify(attempt.examVersion));
    for (const sec of safeExamVersion.sections) {
      for (const q of sec.questions) {
        for (const opt of q.options) {
          delete opt.isCorrect;
        }
      }
    }

    return {
      ...attempt,
      examVersion: safeExamVersion
    };
  }

  static async saveResponse(attemptId: string, userId: string, questionId: string, selectedOptionId: string | null, markedForReview: boolean) {
    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new ForbiddenError('Access denied');
    if (attempt.status !== 'IN_PROGRESS') throw new DomainError('Attempt is no longer in progress', 'ATTEMPT_CLOSED', 400);

    if (attempt.expiresAt.getTime() + 10000 < Date.now()) {
      LoggerService.warn('Time expired on saveResponse, auto-submitting', { attemptId, userId });
      await this.submitAttempt(attemptId, userId, true);
      throw new DomainError('Time expired', 'TIME_EXPIRED', 400);
    }

    return AttemptRepository.upsertResponse(attemptId, questionId, selectedOptionId, markedForReview);
  }

  static async submitAttempt(attemptId: string, userId: string, isAutoSubmit = false) {
    const attempt = await AttemptRepository.getAttemptWithResponses(attemptId);
    if (!attempt || attempt.userId !== userId) throw new ForbiddenError('Access denied');
    if (attempt.status !== 'IN_PROGRESS') return attempt;

    const score = EvaluationService.calculateScore(attempt, attempt.examVersion);
    
    return AttemptRepository.submitAttempt(attemptId, score, isAutoSubmit);
  }
}

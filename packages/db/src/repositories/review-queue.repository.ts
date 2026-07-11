import { prisma } from '../index';
import type { Prisma, ReviewQueue, ReviewStatus } from '@prisma/client';

export class ReviewQueueRepository {
  static async create(data: Prisma.ReviewQueueUncheckedCreateInput): Promise<ReviewQueue> {
    return prisma.reviewQueue.create({ data });
  }

  static async findById(id: string): Promise<ReviewQueue | null> {
    return prisma.reviewQueue.findUnique({ where: { id } });
  }

  static async findByParserJobId(parserJobId: string): Promise<ReviewQueue | null> {
    return prisma.reviewQueue.findUnique({ where: { parserJobId } });
  }

  static async updateStatus(id: string, status: ReviewStatus, reviewedBy?: string): Promise<ReviewQueue> {
    return prisma.reviewQueue.update({
      where: { id },
      data: {
        status,
        ...(reviewedBy ? { reviewedBy, reviewedAt: new Date() } : {}),
      },
    });
  }
}

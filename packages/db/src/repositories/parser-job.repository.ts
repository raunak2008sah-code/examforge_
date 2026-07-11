import { prisma } from '../index';
import type { Prisma, ParserJob, ParserStatus } from '@prisma/client';

export class ParserJobRepository {
  static async create(data: Prisma.ParserJobUncheckedCreateInput): Promise<ParserJob> {
    return prisma.parserJob.create({ data });
  }

  static async findById(id: string): Promise<Prisma.ParserJobGetPayload<{ include: { file: true } }> | null> {
    return prisma.parserJob.findUnique({ where: { id }, include: { file: true } });
  }

  static async findByFileId(fileId: string): Promise<ParserJob | null> {
    return prisma.parserJob.findFirst({ where: { fileId }, orderBy: { createdAt: 'desc' } });
  }

  static async updateStatus(id: string, status: ParserStatus, data?: Partial<Prisma.ParserJobUncheckedUpdateInput>): Promise<ParserJob> {
    const updateData: Prisma.ParserJobUncheckedUpdateInput = { status, ...data };
    
    if (status === 'PROCESSING') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    return prisma.parserJob.update({
      where: { id },
      data: updateData,
    });
  }
}

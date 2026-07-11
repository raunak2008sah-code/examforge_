import { prisma } from '../index';
import type { Prisma, UploadedFile } from '@prisma/client';

export class UploadedFileRepository {
  static async create(data: Prisma.UploadedFileUncheckedCreateInput): Promise<UploadedFile> {
    return prisma.uploadedFile.create({ data });
  }

  static async findById(id: string): Promise<UploadedFile | null> {
    return prisma.uploadedFile.findUnique({ where: { id } });
  }

  static async findByChecksum(checksum: string): Promise<UploadedFile | null> {
    return prisma.uploadedFile.findFirst({ where: { checksum } });
  }

  static async findByUserId(userId: string): Promise<UploadedFile[]> {
    return prisma.uploadedFile.findMany({ where: { uploadedBy: userId } });
  }
}

import { prisma } from '../index';
import type { Exam } from '@prisma/client';

export class ExamRepository {
  /**
   * Commits a draft workingJson into the relational database structure.
   */
  static async commitFromReviewQueue(
    reviewId: string,
    ownerId: string,
    isOfficial: boolean,
    visibility: 'PRIVATE' | 'PUBLIC' | 'UNLISTED',
    workingJson: any
  ): Promise<Exam> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the base Exam
      const exam = await tx.exam.create({
        data: {
          title: workingJson.title || 'Untitled Exam',
          examType: workingJson.examType || 'JEE_MAIN',
          visibility,
          isOfficial,
          ownerId,
        }
      });

      // 2. Create the ExamVersion
      const version = await tx.examVersion.create({
        data: {
          examId: exam.id,
          versionNumber: 1,
          status: visibility === 'PUBLIC' ? 'PUBLISHED' : 'DRAFT',
          snapshotJson: workingJson,
          publishedBy: visibility === 'PUBLIC' ? ownerId : null,
          publishedAt: visibility === 'PUBLIC' ? new Date() : null,
        }
      });

      // 3. Link Exam.currentVersionId
      await tx.exam.update({
        where: { id: exam.id },
        data: { currentVersionId: version.id }
      });

      // 4. Create nested Sections and Questions
      if (Array.isArray(workingJson.sections)) {
        for (const [sIdx, sec] of workingJson.sections.entries()) {
          const section = await tx.section.create({
            data: {
              examVersionId: version.id,
              name: sec.name || `Section ${sIdx + 1}`,
              order: sec.order ?? sIdx + 1,
            }
          });

          if (Array.isArray(sec.questions)) {
            for (const [qIdx, q] of sec.questions.entries()) {
              const question = await tx.question.create({
                data: {
                  sectionId: section.id,
                  displayNumber: q.displayNumber || String(qIdx + 1),
                  statement: q.statement || '',
                  imageUrls: q.imageUrls || [],
                  order: q.order ?? qIdx + 1,
                }
              });

              if (Array.isArray(q.options)) {
                for (const opt of q.options) {
                  await tx.option.create({
                    data: {
                      questionId: question.id,
                      label: opt.label || 'A',
                      text: opt.text || '',
                      isCorrect: !!opt.isCorrect,
                    }
                  });
                }
              }
            }
          }
        }
      }

      // 5. Update ReviewQueue to APPROVED
      await tx.reviewQueue.update({
        where: { id: reviewId },
        data: {
          status: 'APPROVED',
          reviewedBy: ownerId,
          reviewedAt: new Date(),
        }
      });

      return exam;
    });
  }
}

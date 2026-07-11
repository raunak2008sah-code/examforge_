import { z } from 'zod';
import { ExamType, ExamVersionStatus } from '@examforge/db';
import { UuidSchema, createPaginatedResponseSchema } from '../../core';
import { ExamDocumentSchema } from '../parser';

export const ExamTypeSchema = z.nativeEnum(ExamType);
export const ExamVersionStatusSchema = z.nativeEnum(ExamVersionStatus);

export const ExamListItemSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  examType: ExamTypeSchema,
  durationMinutes: z.number().int().min(1),
  currentVersionId: UuidSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ExamListItem = z.infer<typeof ExamListItemSchema>;

export const ExamListResponseSchema = createPaginatedResponseSchema(ExamListItemSchema);
export type ExamListResponse = z.infer<typeof ExamListResponseSchema>;

export const ExamDetailResponseSchema = ExamListItemSchema.extend({
  // Included nested relations or specific details if any
});

export type ExamDetailResponse = z.infer<typeof ExamDetailResponseSchema>;

export const ExamPatchRequestSchema = z.object({
  title: z.string().min(1).optional(),
});

export type ExamPatchRequest = z.infer<typeof ExamPatchRequestSchema>;

export const ExamVersionListItemSchema = z.object({
  id: UuidSchema,
  examId: UuidSchema,
  versionNumber: z.number().int(),
  status: ExamVersionStatusSchema,
  publishedBy: UuidSchema.nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type ExamVersionListItem = z.infer<typeof ExamVersionListItemSchema>;

export const ExamVersionListResponseSchema =
  createPaginatedResponseSchema(ExamVersionListItemSchema);
export type ExamVersionListResponse = z.infer<typeof ExamVersionListResponseSchema>;

export const ExamVersionDetailResponseSchema = ExamVersionListItemSchema.extend({
  snapshotJson: ExamDocumentSchema.nullable(), // Only present if status is PUBLISHED
});

export type ExamVersionDetailResponse = z.infer<typeof ExamVersionDetailResponseSchema>;

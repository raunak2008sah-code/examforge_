import { z } from 'zod';
import { ReviewStatus } from '@examforge/db';
import { UuidSchema, createPaginatedResponseSchema } from '../../core';
import { ExamDocumentSchema } from '../parser';

export const ReviewStatusSchema = z.nativeEnum(ReviewStatus);

export const ReviewQueueListItemSchema = z.object({
  id: UuidSchema,
  parserJobId: UuidSchema,
  status: ReviewStatusSchema,
  reviewedBy: UuidSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ReviewQueueListItem = z.infer<typeof ReviewQueueListItemSchema>;

export const ReviewQueueListResponseSchema =
  createPaginatedResponseSchema(ReviewQueueListItemSchema);

export type ReviewQueueListResponse = z.infer<typeof ReviewQueueListResponseSchema>;

export const ReviewQueueDetailResponseSchema = ReviewQueueListItemSchema.extend({
  payloadJson: ExamDocumentSchema, // The working JSON
});

export type ReviewQueueDetailResponse = z.infer<typeof ReviewQueueDetailResponseSchema>;

export const ReviewQueuePatchRequestSchema = z.object({
  payloadJson: ExamDocumentSchema, // Saving edits
});

export type ReviewQueuePatchRequest = z.infer<typeof ReviewQueuePatchRequestSchema>;

export const ReviewQueueApproveResponseSchema = z.object({
  examId: UuidSchema,
  examVersionId: UuidSchema,
  status: z.literal('PUBLISHED'),
});

export type ReviewQueueApproveResponse = z.infer<typeof ReviewQueueApproveResponseSchema>;

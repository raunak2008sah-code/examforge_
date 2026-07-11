import { z } from 'zod';
import { AttemptStatus } from '@examforge/db';
import { UuidSchema } from '../../core';
import { ExamDocumentSchema, ParsedSectionSchema } from '../parser';

export const AttemptStatusSchema = z.nativeEnum(AttemptStatus);

export const AttemptStartResponseSchema = z.object({
  attemptId: UuidSchema,
  examVersionId: UuidSchema,
  expiresAt: z.string().datetime(),
  sections: z.array(ParsedSectionSchema), // Note: Frontend will receive this WITHOUT isCorrect flags
});

export type AttemptStartResponse = z.infer<typeof AttemptStartResponseSchema>;

export const AttemptResponseItemSchema = z.object({
  questionId: UuidSchema,
  selectedOptionId: UuidSchema.nullable(),
  markedForReview: z.boolean(),
  answeredAt: z.string().datetime().nullable(),
});

export type AttemptResponseItem = z.infer<typeof AttemptResponseItemSchema>;

export const AttemptResumeResponseSchema = z.object({
  id: UuidSchema,
  status: AttemptStatusSchema,
  startedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  lastAutosaveAt: z.string().datetime().nullable(),
  examSnapshot: ExamDocumentSchema, // Snapshot of the exam version
  responses: z.array(AttemptResponseItemSchema),
});

export type AttemptResumeResponse = z.infer<typeof AttemptResumeResponseSchema>;

export const AttemptAutosaveRequestSchema = z.object({
  questionId: UuidSchema,
  selectedOptionId: UuidSchema.nullable(),
  markedForReview: z.boolean().optional(),
});

export type AttemptAutosaveRequest = z.infer<typeof AttemptAutosaveRequestSchema>;

export const AttemptAutosaveResponseSchema = z.object({
  savedAt: z.string().datetime(),
});

export type AttemptAutosaveResponse = z.infer<typeof AttemptAutosaveResponseSchema>;

export const AttemptSubmitResponseSchema = z.object({
  attemptId: UuidSchema,
  status: z.literal('SUBMITTED'),
  score: z.number().nullable(),
});

export type AttemptSubmitResponse = z.infer<typeof AttemptSubmitResponseSchema>;

export const AttemptResultResponseSchema = z.object({
  attemptId: UuidSchema,
  score: z.number().nullable(),
  status: AttemptStatusSchema,
  submittedAt: z.string().datetime().nullable(),
  // Can include detailed breakdown here later
});

export type AttemptResultResponse = z.infer<typeof AttemptResultResponseSchema>;

export const ExamResultAggregateSchema = z.object({
  examId: UuidSchema,
  totalAttempts: z.number().int(),
  averageScore: z.number().nullable(),
  highestScore: z.number().nullable(),
});

export type ExamResultAggregate = z.infer<typeof ExamResultAggregateSchema>;

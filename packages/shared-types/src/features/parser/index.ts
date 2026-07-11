import { z } from 'zod';
import { ParserStatusSchema } from '../upload';
import { UuidSchema } from '../../core';

export const AssetRefSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: z.enum(['image', 'table']),
});

export const ParsedOptionSchema = z.object({
  id: z.string(),
  label: z.enum(['A', 'B', 'C', 'D', 'E', 'F']),
  text: z.string(),
  isCorrect: z.boolean().optional(),
});

export type ParsedOption = z.infer<typeof ParsedOptionSchema>;

export const ParsedQuestionSchema = z.object({
  id: z.string(),
  displayNumber: z.string(),
  statement: z.string(),
  options: z.array(ParsedOptionSchema),
  correctOption: z.string().nullable(),
  images: z.array(AssetRefSchema).optional(),
  tables: z.array(AssetRefSchema).optional(),
  confidence: z.number().min(0).max(100),
  flags: z.array(z.string()),
  reviewStatus: z.enum(['pending', 'edited', 'approved']).default('pending'),
});

export type ParsedQuestion = z.infer<typeof ParsedQuestionSchema>;

export const ParsedSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int(),
  questions: z.array(ParsedQuestionSchema),
});

export type ParsedSection = z.infer<typeof ParsedSectionSchema>;

export const ProcessingErrorSchema = z.object({
  stage: z.string(),
  severity: z.enum(['warning', 'error', 'fatal']),
  message: z.string(),
  context: z.record(z.string(), z.any()).optional(),
});

export type ProcessingError = z.infer<typeof ProcessingErrorSchema>;

export const ParserMetadataSchema = z.object({
  examName: z.string(),
  sourceFileId: UuidSchema,
  parserUsed: z.string(),
  parserVersion: z.string(),
  processedAt: z.string().datetime(),
  pageCount: z.number().int(),
  detectionMode: z.enum(['digital', 'scanned', 'mixed']),
});

export type ParserMetadata = z.infer<typeof ParserMetadataSchema>;

export const ExamDocumentSchema = z.object({
  metadata: ParserMetadataSchema,
  sections: z.array(ParsedSectionSchema),
  confidence: z.object({
    overall: z.number().min(0).max(100),
    breakdown: z.record(z.string(), z.number()),
  }),
  errors: z.array(ProcessingErrorSchema),
  schemaVersion: z.string(),
});

export type ExamDocument = z.infer<typeof ExamDocumentSchema>;

// API endpoints
export const ParserJobStatusUpdateSchema = z.object({
  status: ParserStatusSchema,
  resultJson: ExamDocumentSchema.optional(),
  errorSummary: z.string().optional(),
});

export type ParserJobStatusUpdate = z.infer<typeof ParserJobStatusUpdateSchema>;

export const ParserJobStatusResponseSchema = z.object({
  jobId: UuidSchema,
  status: ParserStatusSchema,
});

export type ParserJobStatusResponse = z.infer<typeof ParserJobStatusResponseSchema>;

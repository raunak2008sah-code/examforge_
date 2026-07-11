import { z } from 'zod';
import { FilePurpose, ParserStatus } from '@examforge/db';
import { UuidSchema } from '../../core';

export const FilePurposeSchema = z.nativeEnum(FilePurpose);
export const ParserStatusSchema = z.nativeEnum(ParserStatus);

// Note: POST /api/v1/uploads uses multipart/form-data,
// so the request schema here is mostly for documentation or
// if a framework parses it into an object.
export const UploadRequestSchema = z.object({
  file: z.any(), // File blob
  answerKeyFile: z.any().optional(), // File blob
});

export const UploadResponseSchema = z.object({
  uploadedFileId: UuidSchema,
  parserJobId: UuidSchema,
  status: ParserStatusSchema,
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const UploadedFileMetadataSchema = z.object({
  id: UuidSchema,
  originalFilename: z.string(),
  storagePath: z.string(),
  purpose: FilePurposeSchema,
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  checksum: z.string(),
  uploadedBy: UuidSchema,
  createdAt: z.string().datetime(),
});

export type UploadedFileMetadata = z.infer<typeof UploadedFileMetadataSchema>;

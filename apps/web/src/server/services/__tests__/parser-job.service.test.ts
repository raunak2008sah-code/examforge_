import { describe, it, expect, vi } from 'vitest';

process.env.SUPABASE_URL = 'https://placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder';

import { ParserJobService } from '../parser-job.service';
import { UploadedFileRepository, ParserJobRepository } from '@examforge/db';
import { RealParserAdapter } from '../real-parser.adapter';

vi.mock('@examforge/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@examforge/db')>();
  return {
    ...actual,
    UploadedFileRepository: { findById: vi.fn() },
    ParserJobRepository: { findByFileId: vi.fn(), create: vi.fn() }
  };
});
vi.mock('../real-parser.adapter');

describe('ParserJobService', () => {
  it('should create a job if file is QUESTION_PAPER and belongs to user', async () => {
    vi.mocked(UploadedFileRepository.findById).mockResolvedValue({
      id: 'file-1',
      uploadedBy: 'user-1',
      purpose: 'QUESTION_PAPER',
    } as any);

    vi.mocked(ParserJobRepository.findByFileId).mockResolvedValue(null);
    vi.mocked(ParserJobRepository.create).mockResolvedValue({ id: 'job-1', status: 'QUEUED' } as any);

    const job = await ParserJobService.createJob('user-1', 'file-1');
    
    expect(job.status).toBe('QUEUED');
    expect(ParserJobRepository.create).toHaveBeenCalledWith({ fileId: 'file-1', status: 'QUEUED' });
  });

  it('should throw if file does not belong to user', async () => {
    vi.mocked(UploadedFileRepository.findById).mockResolvedValue({
      id: 'file-1',
      uploadedBy: 'user-2', // Different user
      purpose: 'QUESTION_PAPER',
    } as any);

    await expect(ParserJobService.createJob('user-1', 'file-1')).rejects.toThrow('Uploaded file not found or access denied.');
  });
});

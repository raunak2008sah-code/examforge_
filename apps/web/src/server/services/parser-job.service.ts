import { ParserJobRepository, UploadedFileRepository } from '@examforge/db';
import { NotFoundError, ValidationError } from '../errors/domain-errors';
import { RealParserAdapter } from './real-parser.adapter';
import type { ParserJob, UploadedFile } from '@examforge/db';

export class ParserJobService {
  static async createJob(userId: string, fileId: string): Promise<ParserJob> {
    // 1. Verify ownership
    const file = await UploadedFileRepository.findById(fileId);
    if (!file || file.uploadedBy !== userId) {
      throw new NotFoundError('Uploaded file not found or access denied.');
    }

    if (file.purpose !== 'QUESTION_PAPER') {
      throw new ValidationError('Can only parse QUESTION_PAPER files.');
    }

    // 2. Check if a job already exists for this file
    const existingJob = await ParserJobRepository.findByFileId(fileId);
    if (existingJob && (existingJob.status === 'QUEUED' || existingJob.status === 'PROCESSING')) {
      return existingJob; // Idempotent behavior
    }

    // 3. Create Job
    return ParserJobRepository.create({
      fileId,
      status: 'QUEUED',
    });
  }

  static async getJobStatus(jobId: string, userId: string): Promise<ParserJob | null> {
    let job = await ParserJobRepository.findById(jobId);
    if (!job) return null;
    
    // Safety check: The repository includes the file relation for ownership verification
    if (job.file?.uploadedBy !== userId) {
       return null;
    }
    
    // REAL PARSER INTEGRATION
    const updatedJob = await RealParserAdapter.processJob(job as any);

    if (updatedJob.status !== job.status) {
      return ParserJobRepository.findById(jobId);
    }

    return job;
  }
}

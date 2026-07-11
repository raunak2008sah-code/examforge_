import { ParserJobRepository, ReviewQueueRepository } from '@examforge/db';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import type { ParserJob, UploadedFile } from '@examforge/db';

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://localhost:8000';

export class RealParserAdapter {
  static async processJob(job: ParserJob & { file?: UploadedFile }): Promise<ParserJob> {
    const status = job.status as string;
    if (status === 'COMPLETED' || status === 'FAILED') {
      return job;
    }

    try {
      // 1. Move to PROCESSING
      if (status === 'QUEUED') {
        job = await ParserJobRepository.updateStatus(job.id, 'PROCESSING');
      }

      if (!job.file || !job.file.storagePath) {
         throw new Error("Job file missing storage path");
      }

      // 2. Generate signed URL for the FastAPI service to download
      const signedUrl = await StorageService.getSignedUrl(job.file.storagePath, 3600);

      // 3. Call FastAPI Service
      LoggerService.info('Calling FastAPI Parser', { jobId: job.id, url: PARSER_SERVICE_URL });
      
      const response = await fetch(`${PARSER_SERVICE_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: signedUrl })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`FastAPI Parser failed: ${response.status} ${errText}`);
      }

      const parsedJson = await response.json();

      // 4. Update Job and create ReviewQueue
      const updatedJob = await ParserJobRepository.updateStatus(job.id, 'COMPLETED', {
        overallConfidence: 0.85, // We can get this dynamically from parser later
        resultJson: { message: "Parsed successfully via FastAPI" } as any
      });

      await ReviewQueueRepository.create({
        parserJobId: job.id,
        workingJson: parsedJson as any,
        status: 'PENDING',
      });

      LoggerService.info('FastAPI Parser completed', { jobId: job.id });
      return updatedJob;

    } catch (error: any) {
      LoggerService.error('Parser Adapter Error', { jobId: job.id, error: error.message });
      return ParserJobRepository.updateStatus(job.id, 'FAILED', {
        error: error.message
      } as any);
    }
  }
}

import crypto from 'crypto';
import { UploadedFileRepository } from '@examforge/db';
import { StorageService } from './storage.service';
import { ValidationError, ConflictError } from '../errors/domain-errors';
import type { UploadedFile, FilePurpose } from '@examforge/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export class UploadService {
  static async processUpload(
    userId: string,
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    purpose: FilePurpose = 'QUESTION_PAPER'
  ): Promise<UploadedFile> {
    // 1. Validate
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new ValidationError(`Unsupported file type: ${mimeType}. Only PDFs are allowed.`);
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new ValidationError(`File exceeds the 10MB limit.`);
    }

    // 2. Checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // 3. Duplicate detection
    const existingFile = await UploadedFileRepository.findByChecksum(checksum);
    if (existingFile && existingFile.uploadedBy === userId) {
      throw new ConflictError('You have already uploaded this exact file.');
    }

    // 4. Secure Path
    const storagePath = `${userId}/${checksum}.pdf`;

    // 5. Upload to Storage
    await StorageService.uploadFile(storagePath, buffer, mimeType);

    // 6. DB Record
    const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    return UploadedFileRepository.create({
      storagePath,
      originalFilename: sanitizedName,
      mimeType,
      sizeBytes: buffer.length,
      checksum,
      uploadedBy: userId,
      purpose,
    });
  }

  static async getUploadDetails(id: string, userId: string): Promise<UploadedFile | null> {
    const file = await UploadedFileRepository.findById(id);
    if (!file || file.uploadedBy !== userId) {
      return null;
    }
    return file;
  }
}

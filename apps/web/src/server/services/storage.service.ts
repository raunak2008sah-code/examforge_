import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageError } from '../errors/domain-errors';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if ((!supabaseUrl || !supabaseServiceKey) && process.env.NODE_ENV !== 'test') {
  console.warn('Supabase credentials missing. Storage service will fail during execution.');
}

// We use the service key because these operations are entirely server-side orchestrated
const supabase: SupabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');
const BUCKET_NAME = 'exam-pdfs';

export class StorageService {
  /**
   * Uploads a file to Supabase Storage.
   */
  static async uploadFile(path: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      if (error.message.includes('Duplicate') || error.message.includes('already exists')) {
         return path;
      }
      throw new StorageError(`Failed to upload to Supabase: ${error.message}`);
    }

    return data.path;
  }

  static async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new StorageError(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}

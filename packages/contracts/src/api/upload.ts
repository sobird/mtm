import { z } from 'zod';

export const UPLOAD_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const uploadResultSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
});

export type UploadResult = z.infer<typeof uploadResultSchema>;

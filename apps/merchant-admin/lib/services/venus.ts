import { initDatabase } from '@/lib/db';

import { AppError } from '../errors';
import { getReferenceData } from './reference-data';

export interface VenusOcrResult {
  name?: string;
  idCard?: string;
  citizenId?: string;
  number?: string;
  address?: string;
  term?: unknown;
  validdate?: unknown;
  capital?: string;
  [key: string]: unknown;
}

export interface VenusSignReference {
  token: string;
  expire: number;
  bucket: string;
}

export interface VenusSignResult extends VenusSignReference {
  url: string;
}

export interface VenusUploadResult {
  url: string;
  name?: string;
  size?: number;
  type?: string;
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/**
 * Demo OCR: returns the seeded reference row matching `type`
 * (0 = ID card, 1 = business license). The image is accepted but unused.
 */
export async function ocr(input: { image: string; type?: number }): Promise<VenusOcrResult> {
  await initDatabase();

  const rows = await getReferenceData<Array<VenusOcrResult | null>>('venus-ocr');
  const type = input.type ?? 0;
  const row = Array.isArray(rows) ? rows[type] : null;

  if (!row) {
    throw new AppError('OCR_NOT_FOUND', 404, '未识别到有效信息');
  }

  return row;
}

/** Demo signing: builds a deterministic object URL from the seeded `venus-sign` reference. */
export async function sign(input: { contractId: string }): Promise<VenusSignResult> {
  await initDatabase();

  const reference = await getReferenceData<VenusSignReference>('venus-sign');

  return {
    url: `${reference.bucket}/${input.contractId}.pdf`,
    token: reference.token,
    expire: reference.expire,
    bucket: reference.bucket,
  };
}

/** Demo upload: keeps the file in memory and returns it as a data URL. */
export async function upload(input: FormData): Promise<VenusUploadResult> {
  await initDatabase();

  const file = input.get('file');

  if (!file || typeof file === 'string' || typeof (file as Blob).arrayBuffer !== 'function') {
    throw new AppError('INVALID_BODY', 400, '请选择上传文件');
  }

  const blob = file as Blob;

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new AppError('FILE_TOO_LARGE', 400, '文件大小不能超过20MB');
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const mime = blob.type || 'application/octet-stream';

  return {
    url: `data:${mime};base64,${buffer.toString('base64')}`,
    name: (blob as File).name,
    size: blob.size,
    type: mime,
  };
}

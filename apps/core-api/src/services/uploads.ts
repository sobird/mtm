import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_BYTES } from '@mtm/contracts';
import type { UploadResult } from '@mtm/contracts';

import { prisma } from '../db';
import { HttpError } from '../http';

const DEFAULT_UPLOAD_DIR = 'var/uploads';
const DEFAULT_PUBLIC_URL = 'http://localhost:4000';

type AllowedMimeType = (typeof UPLOAD_ALLOWED_MIME_TYPES)[number];

const EXTENSIONS: Record<AllowedMimeType, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export interface UploadConfig {
  /** Directory the uploaded files are written to. */
  dir: string;
  maxBytes: number;
  /** Absolute URL prefix used to build publicly accessible asset URLs. */
  publicUrl: string;
}

/**
 * Reads upload configuration at call time so tests (and hot reloads) can change
 * the environment before the app is created. Invalid or non-positive
 * `UPLOAD_MAX_BYTES` values fall back to the contract default.
 */
export function resolveUploadConfig(): UploadConfig {
  const configuredMaxBytes = Number(process.env.UPLOAD_MAX_BYTES);

  return {
    dir: process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR,
    maxBytes:
      Number.isFinite(configuredMaxBytes) && configuredMaxBytes > 0 ? Math.trunc(configuredMaxBytes) : UPLOAD_MAX_BYTES,
    publicUrl: (process.env.CORE_PUBLIC_URL || DEFAULT_PUBLIC_URL).replace(/\/+$/, ''),
  };
}

/** Minimal storage seam so files can move to an object store later. */
export interface StorageAdapter {
  save(filename: string, data: Uint8Array): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly dir: string) {}

  async save(filename: string, data: Uint8Array): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, filename), data);
  }
}

function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

function invalidFile(): HttpError {
  return new HttpError('UPLOAD_INVALID_FILE', 400, '上传文件不合法');
}

/**
 * Allowance for multipart boundaries and field headers. The declared
 * `Content-Length` covers the whole body, not just the file, so a legitimate
 * file at the size limit still needs this headroom before we reject it.
 */
export const MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

/**
 * Rejects clearly oversized multipart requests from the declared header before
 * the body is buffered into memory. A missing or non-numeric header passes so
 * the exact per-file check in `assertValidUpload` remains the final authority.
 */
export function assertDeclaredUploadSize(contentLength: string | undefined, maxBytes: number): void {
  if (contentLength === undefined) {
    return;
  }

  const declared = Number(contentLength);

  if (Number.isFinite(declared) && declared > maxBytes + MULTIPART_OVERHEAD_BYTES) {
    throw new HttpError('UPLOAD_TOO_LARGE', 413, '上传文件过大');
  }
}

/** Validates the multipart file before any bytes are written to storage. */
export function assertValidUpload(file: unknown, maxBytes: number): asserts file is File {
  if (!(file instanceof File) || file.size <= 0) {
    throw invalidFile();
  }

  if (!isAllowedMimeType(file.type)) {
    throw new HttpError('UPLOAD_UNSUPPORTED_TYPE', 400, '不支持的文件类型');
  }

  if (file.size > maxBytes) {
    throw new HttpError('UPLOAD_TOO_LARGE', 400, '文件超过大小限制');
  }
}

export interface SaveUploadInput {
  file: unknown;
  uploadedBy: string;
  merchantId: string | null;
  config: UploadConfig;
  storage: StorageAdapter;
}

export type UploadedAsset = UploadResult;

/**
 * Persists an uploaded image under a random filename derived from its MIME
 * type, writes a `MediaAsset` row and returns the public URL.
 */
export async function saveUpload(input: SaveUploadInput): Promise<UploadedAsset> {
  const { file, uploadedBy, merchantId, config, storage } = input;

  assertValidUpload(file, config.maxBytes);

  const mimeType = file.type as AllowedMimeType;
  const filename = `${randomUUID()}${EXTENSIONS[mimeType]}`;
  const data = new Uint8Array(await file.arrayBuffer());

  await storage.save(filename, data);

  const asset = await prisma.mediaAsset.create({
    data: {
      filename,
      mimeType,
      size: file.size,
      url: `${config.publicUrl}/uploads/${filename}`,
      uploadedBy,
      merchantId,
    },
  });

  return { id: asset.id, url: asset.url };
}

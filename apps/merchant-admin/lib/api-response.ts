import type { PageMeta } from '@mtm/contracts';
import { NextResponse } from 'next/server';

import { AppError } from './errors';

export interface ApiSuccess<T> {
  code: 0;
  message: 'ok';
  data: T;
}

export interface ApiPageSuccess<T> extends ApiSuccess<T> {
  meta: PageMeta;
}

export interface ApiFailure {
  code: string;
  message: string;
  data: null;
}

type ErrorShape = {
  code: string;
  status: number;
  message: string;
};

function isErrorShape(error: unknown): error is ErrorShape {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  return (
    typeof candidate.code === 'string' && typeof candidate.status === 'number' && typeof candidate.message === 'string'
  );
}

export function ok<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>({ code: 0, message: 'ok', data });
}

export function okPage<T>(data: T, meta: PageMeta): NextResponse<ApiPageSuccess<T>> {
  return NextResponse.json<ApiPageSuccess<T>>({ code: 0, message: 'ok', data, meta });
}

export function fail(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof AppError || isErrorShape(error)) {
    const { code, status, message } = error;

    return NextResponse.json<ApiFailure>({ code, message, data: null }, { status });
  }

  return NextResponse.json<ApiFailure>(
    { code: 'INTERNAL_ERROR', message: '服务器内部错误', data: null },
    { status: 500 }
  );
}

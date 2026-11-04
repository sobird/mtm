import { createTranslator } from '@mtm/i18n';
import { expect, test } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { translateApiError } from '@/lib/translate-api-error';

const t = createTranslator('en-US');

test('translates a known ApiError by code, not by its message', () => {
  expect(translateApiError(new ApiError('PRODUCT_IN_REVIEW', 409, '商品审核中'), t)).toBe(
    'This product is under review and cannot be edited.'
  );
});

test('falls back to errors.UNKNOWN for unknown errors', () => {
  expect(translateApiError(new Error('boom'), t)).toBe(t('errors.UNKNOWN'));
  expect(translateApiError(new ApiError('SOMETHING_NEW', 400), t)).toBe(t('errors.UNKNOWN'));
});

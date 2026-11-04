import { translateError, type Translator } from '@mtm/i18n';

import { ApiError } from './api-client';

export function translateApiError(error: unknown, t: Translator, fallbackKey?: string): string {
  if (error instanceof ApiError) {
    return translateError(error.code, t);
  }
  return fallbackKey ? t(fallbackKey) : t('errors.UNKNOWN');
}

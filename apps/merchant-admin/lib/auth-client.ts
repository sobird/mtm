import { getCsrfToken } from 'next-auth/react';

export interface CredentialsSignInResult {
  error?: string;
  code?: string;
}

/**
 * Signs in through a credentials provider.
 *
 * `next-auth/react`'s `signIn({ redirect: false })` parses the returned URL with
 * `new URL(data.url)`, which throws for the relative URLs our `redirect`
 * callback deliberately returns (see `lib/auth.config.ts`). Posting to the
 * callback directly avoids that parse, so relative success URLs work in every
 * deployment mode.
 */
export async function signInWithCredentials(
  provider: string,
  credentials: Record<string, string>,
  callbackUrl = '/'
): Promise<CredentialsSignInResult> {
  const csrfToken = await getCsrfToken();

  if (!csrfToken) {
    return { error: 'Configuration' };
  }

  const response = await fetch(`/api/auth/callback/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    body: new URLSearchParams({ ...credentials, csrfToken, callbackUrl }),
  });

  const data = (await response.json().catch(() => null)) as { url?: string } | null;

  if (!response.ok || !data?.url) {
    return { error: 'CallbackRouteError' };
  }

  // Auth.js appends `error`/`code` to the returned URL. Resolve against the
  // current origin because success URLs stay relative.
  const url = new URL(data.url, window.location.origin);

  return {
    error: url.searchParams.get('error') ?? undefined,
    code: url.searchParams.get('code') ?? undefined,
  };
}

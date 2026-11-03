import { SignJWT, jwtVerify } from 'jose';

export type Portal = 'ops' | 'merchant';

export interface ServiceTokenClaims {
  portal: Portal;
  userId: string;
  merchantId: string | null;
  permissions: string[];
  merchantScope: string[] | null;
}

export const SERVICE_TOKEN_ISSUER = 'mtm-ports';
export const SERVICE_TOKEN_AUDIENCE = 'mtm-core-api';
export const SERVICE_TOKEN_TTL_SECONDS = 60;

export async function signServiceToken(claims: ServiceTokenClaims, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);

  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(SERVICE_TOKEN_ISSUER)
    .setAudience(SERVICE_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SERVICE_TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isStringArrayOrNull(value: unknown): value is string[] | null {
  return value === null || isStringArray(value);
}

function parseClaims(payload: Record<string, unknown>): ServiceTokenClaims {
  const { portal, userId, merchantId, permissions, merchantScope } = payload;

  if (portal !== 'ops' && portal !== 'merchant') {
    throw new Error('INVALID_SERVICE_TOKEN');
  }
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('INVALID_SERVICE_TOKEN');
  }
  if (!isStringOrNull(merchantId)) {
    throw new Error('INVALID_SERVICE_TOKEN');
  }
  if (!isStringArray(permissions)) {
    throw new Error('INVALID_SERVICE_TOKEN');
  }
  if (!isStringArrayOrNull(merchantScope)) {
    throw new Error('INVALID_SERVICE_TOKEN');
  }

  return { portal, userId, merchantId, permissions, merchantScope };
}

export async function verifyServiceToken(token: string, secret: string): Promise<ServiceTokenClaims> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ['HS256'],
    issuer: SERVICE_TOKEN_ISSUER,
    audience: SERVICE_TOKEN_AUDIENCE,
  });

  return parseClaims(payload);
}

import { jwtVerify, SignJWT } from 'jose';

const CAPTCHA_TTL = '5m';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }

  return new TextEncoder().encode(secret);
}

export interface CaptchaDisplay {
  mobile: number;
  captcha: number;
}

export interface CreateCaptchaResult {
  token: string;
  display: CaptchaDisplay;
}

/** Generates a 6-digit code in `100000..999999` so it never loses a leading zero. */
function generateCode(): number {
  return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
}

export async function createCaptcha(mobile: string): Promise<CreateCaptchaResult> {
  const captcha = generateCode();

  const token = await new SignJWT({ mobile, captcha })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CAPTCHA_TTL)
    .sign(getSecret());

  return {
    token,
    display: {
      mobile: Number(mobile),
      captcha,
    },
  };
}

export async function verifyCaptcha(token: string | undefined, input: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });

    return String(payload.captcha) === input;
  } catch {
    return false;
  }
}

import { Registration } from '@/lib/db/models';

export interface RegisterInput {
  interCode: string;
  mobile: string;
  captcha?: string;
}

/**
 * Idempotent registration: the captcha is verified by the route handler.
 */
export async function register(input: RegisterInput): Promise<void> {
  await Registration.findOrCreate({
    where: { interCode: input.interCode, mobile: input.mobile },
    defaults: {
      interCode: input.interCode,
      mobile: input.mobile,
      status: 0,
    },
  });
}

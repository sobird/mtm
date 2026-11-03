import { Invitation, Registration } from '@/lib/db/models';

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

/** Marks an invitation code as accepted by the anonymous onboarding flow. */
export async function acceptInvitation(code: string): Promise<void> {
  await Invitation.create({
    code: String(code),
    mobile: '',
    usedAt: new Date(),
  });
}

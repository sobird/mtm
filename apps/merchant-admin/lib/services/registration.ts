import { prisma } from '@/lib/db';

export interface RegisterInput {
  interCode: string;
  mobile: string;
  captcha?: string;
}

/**
 * Idempotent registration: the captcha is verified by the route handler.
 */
export async function register(input: RegisterInput): Promise<void> {
  const existing = await prisma.registration.findFirst({
    where: { interCode: input.interCode, mobile: input.mobile },
  });

  if (!existing) {
    await prisma.registration.create({
      data: {
        interCode: input.interCode,
        mobile: input.mobile,
        status: 0,
      },
    });
  }
}

/** Marks an invitation code as accepted by the anonymous onboarding flow. */
export async function acceptInvitation(code: string): Promise<void> {
  await prisma.invitation.create({
    data: {
      code: String(code),
      mobile: '',
      usedAt: new Date(),
    },
  });
}

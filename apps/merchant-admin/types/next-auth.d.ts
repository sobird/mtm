import type { User } from 'next-auth';

declare module 'next-auth' {
  interface User {
    accountId: number;
    merchantId: number;
    mobile: string;
    interCode: string;
    login: string;
  }

  interface Session {
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountId?: number;
    merchantId?: number;
    mobile?: string;
    interCode?: string;
    login?: string;
  }
}

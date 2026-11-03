import type { User } from 'next-auth';

declare module 'next-auth' {
  interface User {
    accountId: string;
    merchantId: string;
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
    accountId?: string;
    merchantId?: string;
    mobile?: string;
    interCode?: string;
    login?: string;
    name?: string;
  }
}

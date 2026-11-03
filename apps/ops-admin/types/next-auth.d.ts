import type { User } from 'next-auth';

declare module 'next-auth' {
  interface User {
    accountId: string;
    username: string;
    portal: 'ops';
  }

  interface Session {
    user?: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accountId?: string;
    username?: string;
    portal?: 'ops';
  }
}

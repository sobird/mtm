import type { ReactNode } from 'react';

import { initDatabase } from '@/lib/db';

// Route Handlers are bypassed on the RSC path, so the database must be
// initialized here before coupon pages read from it (R-32, R-53).
export default async function MarketLayout({ children }: { children: ReactNode }) {
  await initDatabase();

  return <>{children}</>;
}

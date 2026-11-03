import type { ReactNode } from 'react';

import { EntryHeader } from '@/components/entry/EntryHeader';
import { initDatabase } from '@/lib/db';

import styles from './entry.module.css';

export default async function EntryLayout({ children }: { children: ReactNode }) {
  await initDatabase();

  return (
    <div className={styles.layout}>
      <EntryHeader />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
